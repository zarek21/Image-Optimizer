# 🖼️🎬 Media Optimizer (Image & Video Optimizer)

Un script rápido y eficiente en Node.js que procesa imágenes y videos de una carpeta `input/`, convierte las imágenes a **WebP con compresión óptima** y comprime videos **MP4** con FFmpeg, guardando únicamente los resultados optimizados en la carpeta `output/`.

---

## ✨ Características

- ⚡ **Conversión de Imágenes a WebP**: Convierte y optimiza imágenes (`.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, `.avif`, `.tiff`, `.gif`, `.svg`) generando la versión `.webp` ultra liviana con alta calidad visual.
- 🎬 **Optimización de Videos MP4**: Comprime videos (`.mp4`, `.mov`, `.mkv`, `.webm`, `.avi`) a MP4 (H.264/AAC + `faststart`) optimizados para la web.
- 📁 **Soporte para subcarpetas**: Mantiene la estructura de carpetas anidadas en `output/`.
- 👀 **Modo Observador (Watcher)**: Procesa automáticamente las imágenes y videos en tiempo real a medida que los agregas o modificas en `input/`.
- 📊 **Estadísticas de compresión**: Muestra en consola el tamaño original, tamaño optimizado y el porcentaje de espacio ahorrado por categoría y total.
- 🚀 **Alto rendimiento**: Impulsado por el motor nativo `sharp` para imágenes y `ffmpeg` para videos.

---

## 🛠️ Requisitos Previos

1. Tener instalado **Node.js** (v18 o superior).
2. Tener instalado **FFmpeg** en tu sistema y accesible en el PATH (requerido únicamente para la optimización de videos).

---

## 🚀 Uso del Script

### 1. Instalar Dependencias (solo la primera vez)

```bash
npm install
```

### 2. Optimización por Lotes (Batch)

Coloca todas las imágenes y/o videos que desees optimizar en la carpeta `input/` y ejecuta:

```bash
npm start
```

Los resultados optimizados aparecerán en la carpeta `output/`.

### 3. Modo Observación Continua (Watch Mode)

Si deseas que el script esté escuchando en segundo plano y optimice automáticamente cualquier imagen o video que pegues o agregues a `input/`:

```bash
npm run watch
```

---

## 📋 Formatos Soportados

### Imágenes
- **JPEG / JPG** (`.jpg`, `.jpeg`) -> Convertido a WebP.
- **PNG** (`.png`) -> Convertido a WebP.
- **HEIC / HEIF** (`.heic`, `.heif`) -> Convertido a WebP.
- **AVIF** (`.avif`) -> Convertido a WebP.
- **GIF** (`.gif`) -> Convertido a WebP animado.
- **TIFF** (`.tiff`, `.tif`) -> Convertido a WebP.
- **SVG** (`.svg`) -> Convertido a WebP.
- **WebP** (`.webp`) -> Re-optimizado al máximo esfuerzo (`effort: 6`).

### Videos
- **MP4** (`.mp4`) -> Optimizado con códec H.264 / AAC y flag `faststart`.
- **MOV, MKV, WEBM, AVI** (`.mov`, `.mkv`, `.webm`, `.avi`) -> Convertidos y optimizados a MP4 web.

---

## 📊 Ejemplo de Salida en Consola

```text
🚀 Iniciando optimización de medios (imágenes y videos)...

📸 Procesando imagen: landscape.jpg (444.65 KB)
  🌐 Convertido a WebP (.webp): 169.14 KB [Reducción: -62.0%]

🎬 Procesando video: promo.mp4 (12.40 MB)
  📹 Video MP4 optimizado (.mp4): 4.15 MB [Reducción: -66.5%]

✨ ¡Proceso de optimización completado con éxito!
--------------------------------------------------
🖼️ Imágenes procesadas:         1 (444.65 KB -> 169.14 KB)
🎬 Videos procesados:           1 (12.40 MB -> 4.15 MB)
📊 Archivos totales procesados: 2
📦 Peso total original:           12.84 MB
🌐 Peso total optimizado:         4.31 MB (-66.4%)
--------------------------------------------------
```

