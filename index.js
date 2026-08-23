import fs from 'node:fs/promises';
import existsSync from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import chokidar from 'chokidar';

const INPUT_DIR = path.resolve('./input');
const OUTPUT_DIR = path.resolve('./output');

// Extensiones de imágenes soportadas
const SUPPORTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.gif', '.svg'
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
 * Asegura que los directorios base e carpetas secundarias existan
 */
async function ensureDirExists(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Optimiza una imagen en su formato original y crea la versión en WebP
 */
async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  // Ignorar archivos no soportados o archivos ocultos / .gitkeep
  if (!SUPPORTED_EXTENSIONS.has(ext) || filename.startsWith('.')) {
    return null;
  }

  const relativePath = path.relative(INPUT_DIR, filePath);
  const outputSubDir = path.dirname(path.join(OUTPUT_DIR, relativePath));
  await ensureDirExists(outputSubDir);

  const stats = await fs.stat(filePath);
  const originalSizeBytes = stats.size;

  const baseNameWithoutExt = path.basename(filePath, path.extname(filePath));
  const targetOriginalPath = path.join(outputSubDir, `${baseNameWithoutExt}${ext}`);
  const targetWebpPath = path.join(outputSubDir, `${baseNameWithoutExt}.webp`);

  console.log(`\n${colors.cyan}📸 Procesando:${colors.reset} ${colors.bright}${relativePath}${colors.reset} (${formatBytes(originalSizeBytes)})`);

  let originalSavedBytes = 0;
  let webpSavedBytes = 0;

  try {
    const imagePipeline = sharp(filePath, { animated: ext === '.gif' });

    // 1. Optimizar en formato original
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(filePath)
        .jpeg({ quality: 80, mozjpeg: true, progressive: true })
        .toFile(targetOriginalPath);
    } else if (ext === '.png') {
      await sharp(filePath)
        .png({ quality: 80, compressionLevel: 9, palette: true })
        .toFile(targetOriginalPath);
    } else if (ext === '.webp') {
      await sharp(filePath)
        .webp({ quality: 80, effort: 6 })
        .toFile(targetOriginalPath);
    } else if (ext === '.avif') {
      await sharp(filePath)
        .avif({ quality: 75, effort: 6 })
        .toFile(targetOriginalPath);
    } else if (ext === '.gif') {
      await sharp(filePath, { animated: true })
        .gif({ colors: 256 })
        .toFile(targetOriginalPath);
    } else if (ext === '.svg') {
      await fs.copyFile(filePath, targetOriginalPath);
    } else {
      await sharp(filePath).toFile(targetOriginalPath);
    }

    const origStats = await fs.stat(targetOriginalPath);
    originalSavedBytes = origStats.size;
    console.log(`  ${colors.green}✔ Formato original (${ext}):${colors.reset} ${formatBytes(origStats.size)} [Reducción: ${getSavingsPercent(originalSizeBytes, origStats.size)}]`);

    // 2. Generar versión WebP optimizada (si el archivo no era ya .webp o si lo era, se genera igual la versión webp)
    if (ext !== '.svg') {
      await sharp(filePath, { animated: ext === '.gif' })
        .webp({ quality: 80, effort: 6 })
        .toFile(targetWebpPath);

      const webpStats = await fs.stat(targetWebpPath);
      webpSavedBytes = webpStats.size;
      console.log(`  ${colors.magenta}🌐 Versión WebP (.webp):${colors.reset} ${formatBytes(webpStats.size)} [Reducción: ${getSavingsPercent(originalSizeBytes, webpStats.size)}]`);
    } else {
      // SVG se mantiene como SVG
      webpSavedBytes = originalSavedBytes;
    }

    return {
      originalSizeBytes,
      optOriginalSizeBytes: originalSavedBytes,
      webpSizeBytes: webpSavedBytes
    };
  } catch (error) {
    console.error(`  ${colors.red}❌ Error procesando ${relativePath}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Escanea recursivamente la carpeta input y procesa todas las imágenes existentes
 */
async function processAllImages() {
  console.log(`${colors.bright}${colors.blue}🚀 Iniciando optimización de imágenes...${colors.reset}`);
  
  await ensureDirExists(INPUT_DIR);
  await ensureDirExists(OUTPUT_DIR);

  // Crear .gitkeep si la carpeta está vacía
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
    return SUPPORTED_EXTENSIONS.has(ext) && !name.startsWith('.');
  });

  if (imageFiles.length === 0) {
    console.log(`\n${colors.yellow}⚠️ No se encontraron imágenes en la carpeta 'input/'.${colors.reset}`);
    console.log(`Coloca tus imágenes en: ${colors.cyan}${INPUT_DIR}${colors.reset}\n`);
    return;
  }

  let totalOriginal = 0;
  let totalOptOriginal = 0;
  let totalWebp = 0;
  let processedCount = 0;

  for (const file of imageFiles) {
    const result = await processImage(file);
    if (result) {
      totalOriginal += result.originalSizeBytes;
      totalOptOriginal += result.optOriginalSizeBytes;
      totalWebp += result.webpSizeBytes;
      processedCount++;
    }
  }

  console.log(`\n${colors.bright}${colors.green}✨ ¡Optimización completada con éxito!${colors.reset}`);
  console.log(`--------------------------------------------------`);
  console.log(`📊 Total de imágenes procesadas: ${colors.bright}${processedCount}${colors.reset}`);
  console.log(`📦 Peso total original:           ${formatBytes(totalOriginal)}`);
  console.log(`⚡ Peso total (Formato Original):  ${formatBytes(totalOptOriginal)} (${getSavingsPercent(totalOriginal, totalOptOriginal)})`);
  console.log(`🌐 Peso total (Formato WebP):      ${formatBytes(totalWebp)} (${getSavingsPercent(totalOriginal, totalWebp)})`);
  console.log(`--------------------------------------------------\n`);
}

/**
 * Modo observación continua (Watcher)
 */
async function startWatcher() {
  await ensureDirExists(INPUT_DIR);
  await ensureDirExists(OUTPUT_DIR);

  console.log(`${colors.bright}${colors.blue}👀 Modo observación activo...${colors.reset}`);
  console.log(`Esperando nuevas imágenes en ${colors.cyan}${INPUT_DIR}${colors.reset}\n`);

  const watcher = chokidar.watch(INPUT_DIR, {
    ignored: /(^|[\/\\])\../, // Ignorar archivos ocultos / .gitkeep
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) {
      await processImage(filePath);
    }
  });

  watcher.on('change', async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) {
      console.log(`\n${colors.yellow}🔄 Imagen modificada detectada: ${path.basename(filePath)}${colors.reset}`);
      await processImage(filePath);
    }
  });
}

// Determinar modo por argumentos de linea de comandos
const isWatchMode = process.argv.includes('--watch') || process.argv.includes('-w');

if (isWatchMode) {
  startWatcher();
} else {
  processAllImages();
}
