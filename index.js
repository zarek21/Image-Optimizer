import fs from 'node:fs/promises';
import existsSync from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import chokidar from 'chokidar';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const INPUT_DIR = path.resolve('./input');
const OUTPUT_DIR = path.resolve('./output');

// Extensiones de imágenes soportadas
const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif', '.tiff', '.tif', '.gif', '.svg'
]);

// Extensiones de video soportadas
const SUPPORTED_VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v'
]);

// ANSI Colors para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

/**
 * Convierte bytes a formato legible (KB, MB)
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calcula la reducción porcentual de tamaño
 */
function getSavingsPercent(original, newSize) {
  if (original <= 0) return '0%';
  const diff = original - newSize;
  const percent = (diff / original) * 100;
  if (percent > 0) {
    return `${colors.green}-${percent.toFixed(1)}%${colors.reset}`;
  } else if (percent < 0) {
    return `${colors.yellow}+${Math.abs(percent).toFixed(1)}%${colors.reset}`;
  }
  return `${colors.gray}0%${colors.reset}`;
}

/**
 * Asegura que los directorios base o carpetas secundarias existan
 */
async function ensureDirExists(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Limpia el contenido de la carpeta input manteniendo .gitkeep
 */
async function cleanInputDir() {
  try {
    const entries = await fs.readdir(INPUT_DIR);
    for (const entry of entries) {
      if (entry === '.gitkeep') continue;
      const fullPath = path.join(INPUT_DIR, entry);
      await fs.rm(fullPath, { recursive: true, force: true });
    }
    console.log(`🧹 Contenido de la carpeta '${colors.cyan}input/${colors.reset}' eliminado correctamente.\n`);
  } catch (error) {
    console.error(`  ${colors.red}❌ Error al limpiar la carpeta input:${colors.reset}`, error.message);
  }
}

/**
 * Comprueba si FFmpeg está instalado en el sistema
 */
async function checkFFmpegInstalled() {
  try {
    await execFileAsync('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convierte y optimiza una imagen a formato WebP en la carpeta output
 */
async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  if (!SUPPORTED_IMAGE_EXTENSIONS.has(ext) || filename.startsWith('.')) {
    return null;
  }

  const relativePath = path.relative(INPUT_DIR, filePath);
  const outputSubDir = path.dirname(path.join(OUTPUT_DIR, relativePath));
  await ensureDirExists(outputSubDir);

  const stats = await fs.stat(filePath);
  const originalSizeBytes = stats.size;

  const baseNameWithoutExt = path.basename(filePath, path.extname(filePath));
  const targetWebpPath = path.join(outputSubDir, `${baseNameWithoutExt}.webp`);

  console.log(`\n${colors.cyan}📸 Procesando imagen:${colors.reset} ${colors.bright}${relativePath}${colors.reset} (${formatBytes(originalSizeBytes)})`);

  try {
    await sharp(filePath, { animated: ext === '.gif' })
      .webp({ quality: 80, effort: 6 })
      .toFile(targetWebpPath);

    const webpStats = await fs.stat(targetWebpPath);
    const webpSizeBytes = webpStats.size;

    console.log(`  ${colors.magenta}🌐 Convertido a WebP (.webp):${colors.reset} ${formatBytes(webpSizeBytes)} [Reducción: ${getSavingsPercent(originalSizeBytes, webpSizeBytes)}]`);

    return {
      originalSizeBytes,
      webpSizeBytes
    };
  } catch (error) {
    console.error(`  ${colors.red}❌ Error procesando imagen ${relativePath}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Ejecuta FFmpeg mediante spawn en una Promesa
 */
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderrData = '';

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg falló (código ${code}): ${stderrData.slice(-300)}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Optimiza un archivo de video a formato MP4 con compresión H.264/AAC
 */
async function processVideo(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  if (!SUPPORTED_VIDEO_EXTENSIONS.has(ext) || filename.startsWith('.')) {
    return null;
  }

  const relativePath = path.relative(INPUT_DIR, filePath);
  const outputSubDir = path.dirname(path.join(OUTPUT_DIR, relativePath));
  await ensureDirExists(outputSubDir);

  const stats = await fs.stat(filePath);
  const originalSizeBytes = stats.size;

  const baseNameWithoutExt = path.basename(filePath, path.extname(filePath));
  const targetMp4Path = path.join(outputSubDir, `${baseNameWithoutExt}.mp4`);

  console.log(`\n${colors.cyan}🎬 Procesando video:${colors.reset} ${colors.bright}${relativePath}${colors.reset} (${formatBytes(originalSizeBytes)})`);

  try {
    const ffmpegArgs = [
      '-i', filePath,
      '-c:v', 'libx264',
      '-crf', '26',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      targetMp4Path
    ];

    await runFFmpeg(ffmpegArgs);

    const mp4Stats = await fs.stat(targetMp4Path);
    const mp4SizeBytes = mp4Stats.size;

    console.log(`  ${colors.magenta}📹 Video MP4 optimizado (.mp4):${colors.reset} ${formatBytes(mp4SizeBytes)} [Reducción: ${getSavingsPercent(originalSizeBytes, mp4SizeBytes)}]`);

    return {
      originalSizeBytes,
      mp4SizeBytes
    };
  } catch (error) {
    console.error(`  ${colors.red}❌ Error procesando video ${relativePath}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Escanea recursivamente la carpeta input y procesa todas las imágenes y videos existentes
 */
async function processAllFiles() {
  console.log(`${colors.bright}${colors.blue}🚀 Iniciando optimización de medios (imágenes y videos)...${colors.reset}`);
  
  await ensureDirExists(INPUT_DIR);
  await ensureDirExists(OUTPUT_DIR);

  const inputGitkeep = path.join(INPUT_DIR, '.gitkeep');
  const outputGitkeep = path.join(OUTPUT_DIR, '.gitkeep');
  if (!existsSync.existsSync(inputGitkeep)) await fs.writeFile(inputGitkeep, '');
  if (!existsSync.existsSync(outputGitkeep)) await fs.writeFile(outputGitkeep, '');

  async function getFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await getFiles(res));
      } else {
        files.push(res);
      }
    }
    return files;
  }

  const allFiles = await getFiles(INPUT_DIR);
  const imageFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const name = path.basename(file);
    return SUPPORTED_IMAGE_EXTENSIONS.has(ext) && !name.startsWith('.');
  });

  const videoFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const name = path.basename(file);
    return SUPPORTED_VIDEO_EXTENSIONS.has(ext) && !name.startsWith('.');
  });

  if (imageFiles.length === 0 && videoFiles.length === 0) {
    console.log(`\n${colors.yellow}⚠️ No se encontraron imágenes ni videos soportados en la carpeta 'input/'.${colors.reset}`);
    console.log(`Coloca tus archivos en: ${colors.cyan}${INPUT_DIR}${colors.reset}\n`);
    return;
  }

  let hasFFmpeg = true;
  if (videoFiles.length > 0) {
    hasFFmpeg = await checkFFmpegInstalled();
    if (!hasFFmpeg) {
      console.log(`\n${colors.red}⚠️ ADVERTENCIA: FFmpeg no se encuentra instalado o accesible en el PATH del sistema.${colors.reset}`);
      console.log(`Se omitirá la optimización de los ${videoFiles.length} archivo(s) de video encontrados.\n`);
    }
  }

  let totalImageOriginal = 0;
  let totalImageWebp = 0;
  let processedImageCount = 0;

  let totalVideoOriginal = 0;
  let totalVideoMp4 = 0;
  let processedVideoCount = 0;

  // Procesar Imágenes
  for (const file of imageFiles) {
    const result = await processImage(file);
    if (result) {
      totalImageOriginal += result.originalSizeBytes;
      totalImageWebp += result.webpSizeBytes;
      processedImageCount++;
    }
  }

  // Procesar Videos (si FFmpeg está disponible)
  if (hasFFmpeg) {
    for (const file of videoFiles) {
      const result = await processVideo(file);
      if (result) {
        totalVideoOriginal += result.originalSizeBytes;
        totalVideoMp4 += result.mp4SizeBytes;
        processedVideoCount++;
      }
    }
  }

  const grandTotalOriginal = totalImageOriginal + totalVideoOriginal;
  const grandTotalOptimized = totalImageWebp + totalVideoMp4;
  const grandTotalProcessed = processedImageCount + processedVideoCount;

  console.log(`\n${colors.bright}${colors.green}✨ ¡Proceso de optimización completado con éxito!${colors.reset}`);
  console.log(`--------------------------------------------------`);
  if (processedImageCount > 0) {
    console.log(`🖼️ Imágenes procesadas:         ${colors.bright}${processedImageCount}${colors.reset} (${formatBytes(totalImageOriginal)} -> ${formatBytes(totalImageWebp)})`);
  }
  if (processedVideoCount > 0) {
    console.log(`🎬 Videos procesados:           ${colors.bright}${processedVideoCount}${colors.reset} (${formatBytes(totalVideoOriginal)} -> ${formatBytes(totalVideoMp4)})`);
  }
  console.log(`📊 Archivos totales procesados: ${colors.bright}${grandTotalProcessed}${colors.reset}`);
  console.log(`📦 Peso total original:           ${formatBytes(grandTotalOriginal)}`);
  console.log(`🌐 Peso total optimizado:         ${formatBytes(grandTotalOptimized)} (${getSavingsPercent(grandTotalOriginal, grandTotalOptimized)})`);
  console.log(`--------------------------------------------------\n`);

  await cleanInputDir();
}

/**
 * Modo observación continua (Watcher)
 */
async function startWatcher() {
  await ensureDirExists(INPUT_DIR);
  await ensureDirExists(OUTPUT_DIR);

  const hasFFmpeg = await checkFFmpegInstalled();

  console.log(`${colors.bright}${colors.blue}👀 Modo observación activo...${colors.reset}`);
  console.log(`Esperando nuevos archivos en ${colors.cyan}${INPUT_DIR}${colors.reset}`);
  if (!hasFFmpeg) {
    console.log(`${colors.yellow}⚠️ Nota: FFmpeg no está disponible. Solo se procesarán imágenes.${colors.reset}`);
  }
  console.log('');

  const watcher = chokidar.watch(INPUT_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  const handleFileChange = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    if (SUPPORTED_IMAGE_EXTENSIONS.has(ext)) {
      const result = await processImage(filePath);
      if (result) {
        await fs.rm(filePath, { force: true });
      }
    } else if (SUPPORTED_VIDEO_EXTENSIONS.has(ext)) {
      if (!hasFFmpeg) {
        console.log(`\n${colors.red}❌ No se puede procesar video ${path.basename(filePath)} porque FFmpeg no está instalado.${colors.reset}`);
        return;
      }
      const result = await processVideo(filePath);
      if (result) {
        await fs.rm(filePath, { force: true });
      }
    }
  };

  watcher.on('add', handleFileChange);
  watcher.on('change', handleFileChange);
}

// Determinar modo por argumentos de linea de comandos
const isWatchMode = process.argv.includes('--watch') || process.argv.includes('-w');

if (isWatchMode) {
  startWatcher();
} else {
  processAllFiles();
}

