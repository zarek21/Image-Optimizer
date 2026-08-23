# 🖼️ Image Optimizer & WebP Converter

Un script rápido y eficiente en Node.js que optimiza imágenes de una carpeta `input/` y guarda los resultados en la carpeta `output/`. Optimiza las imágenes en su **formato original** y además genera automáticamente la versión **WebP con compresión óptima**.

---

## ✨ Características

- ⚡ **Doble optimización**:
  1. Optimiza la imagen en su formato original (`.png`, `.jpg`, `.jpeg`, `.gif`, `.avif`, `.tiff`).
  2. Genera una versión `.webp` ultra liviana con alta calidad visual.
- 📁 **Soporte para subcarpetas**: Mantiene la estructura de carpetas anidadas en `output/`.
- 👀 **Modo Observador (Watcher)**: Procesa automáticamente las imágenes en tiempo real a medida que las agregas o modificas en `input/`.
- 📊 **Estadísticas de compresión**: Muestra en consola el tamaño original, el tamaño optimizado y el porcentaje de espacio ahorrado.
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

Los resultados optimizados aparecerán en la carpeta `output/`.

### 3. Modo Observación Continua (Watch Mode)

Si deseas que el script esté escuchando en segundo plano y optimice automáticamente cualquier imagen que pegues o agregues a `input/`:

```bash
npm run watch
```

---

## 📋 Formatos Soportados

- **JPEG / JPG** (`.jpg`, `.jpeg`) -> Optimizado con MozJPEG progressive.
- **PNG** (`.png`) -> Optimizado con paleta de colores y compresión nivel 9.
- **WebP** (`.webp`) -> Re-optimizado al máximo esfuerzo (`effort: 6`).
- **AVIF** (`.avif`) -> Optimización AVIF de alta calidad.
- **GIF** (`.gif`) -> Optimización de GIFs animados.
- **SVG** (`.svg`) -> Conservado vectorialmente.

---

## 📊 Ejemplo de Salida en Consola

```text
🚀 Iniciando optimización de imágenes...

📸 Procesando: landscape.jpg (444.65 KB)
  ✔ Formato original (.jpg): 176.67 KB [Reducción: -60.3%]
  🌐 Versión WebP (.webp): 169.14 KB [Reducción: -62.0%]

📸 Procesando: landscape.png (930.64 KB)
  ✔ Formato original (.png): 527.78 KB [Reducción: -43.3%]
  🌐 Versión WebP (.webp): 166.13 KB [Reducción: -82.1%]

✨ ¡Optimización completada con éxito!
--------------------------------------------------
📊 Total de imágenes procesadas: 2
📦 Peso total original:           1.34 MB
⚡ Peso total (Formato Original):  704.45 KB (-48.8%)
🌐 Peso total (Formato WebP):      335.27 KB (-75.6%)
--------------------------------------------------
```
