# 🖼️ Image Optimizer & WebP Converter

Un script rápido y eficiente en Node.js que procesa imágenes de una carpeta `input/`, las convierte a formato **WebP con compresión óptima** y guarda únicamente los resultados `.webp` en la carpeta `output/`.

---

## ✨ Características

- ⚡ **Conversión a WebP**: Convierte y optimiza imágenes (`.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, `.avif`, `.tiff`, `.gif`, `.svg`) generando exclusivamente la versión `.webp` ultra liviana con alta calidad visual.
- 📁 **Soporte para subcarpetas**: Mantiene la estructura de carpetas anidadas en `output/`.
- 👀 **Modo Observador (Watcher)**: Procesa automáticamente las imágenes en tiempo real a medida que las agregas o modificas en `input/`.
- 📊 **Estadísticas de compresión**: Muestra en consola el tamaño original, el tamaño WebP convertido y el porcentaje de espacio ahorrado.
- 🚀 **Alto rendimiento**: Impulsado por el motor nativo `sharp` (libvips).

---

## 🛠️ Requisitos Previos

Tener instalado **Node.js** (v18 o superior).

---

## 🚀 Uso del Script

### 1. Instalar Dependencias (solo la primera vez)

```bash
npm install
```

### 2. Optimización por Lotes (Batch)

Coloca todas las imágenes que desees optimizar en la carpeta `input/` y ejecuta:

```bash
npm start
```

Los resultados optimizados en formato `.webp` aparecerán en la carpeta `output/`.

### 3. Modo Observación Continua (Watch Mode)

Si deseas que el script esté escuchando en segundo plano y optimice automáticamente cualquier imagen que pegues o agregues a `input/`:

```bash
npm run watch
```

---

## 📋 Formatos Soportados

- **JPEG / JPG** (`.jpg`, `.jpeg`) -> Convertido a WebP.
- **PNG** (`.png`) -> Convertido a WebP.
- **HEIC / HEIF** (`.heic`, `.heif`) -> Convertido a WebP.
- **AVIF** (`.avif`) -> Convertido a WebP.
- **GIF** (`.gif`) -> Convertido a WebP animado.
- **TIFF** (`.tiff`, `.tif`) -> Convertido a WebP.
- **SVG** (`.svg`) -> Convertido a WebP.
- **WebP** (`.webp`) -> Re-optimizado al máximo esfuerzo (`effort: 6`).

---

## 📊 Ejemplo de Salida en Consola

```text
🚀 Iniciando conversión de imágenes a WebP...

📸 Procesando: landscape.jpg (444.65 KB)
  🌐 Convertido a WebP (.webp): 169.14 KB [Reducción: -62.0%]

📸 Procesando: landscape.png (930.64 KB)
  🌐 Convertido a WebP (.webp): 166.13 KB [Reducción: -82.1%]

✨ ¡Conversión a WebP completada con éxito!
--------------------------------------------------
📊 Total de imágenes procesadas: 2
📦 Peso total original:           1.34 MB
🌐 Peso total WebP:                335.27 KB (-75.6%)
--------------------------------------------------
```
