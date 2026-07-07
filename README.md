# Kontopress

> Compress images instantly. Private. Fast. Free.

[![Version](https://img.shields.io/badge/version-1.0.0-0f172a)](https://github.com/pr3nc2/kontopress/releases)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](LICENSE)

Kontopress is a modern, browser-based image compression tool built with TypeScript and Vite. Everything happens locally inside your browser — no uploads, no cloud processing, no accounts, no tracking.\

https://usekontopress.netlify.app/

## Philosophy

**Your images never leave your device.**

In an era where every SaaS wants your data, Kontopress takes the opposite approach. It is a single-page application that runs entirely in your browser using the Canvas API and modern compression algorithms. No server infrastructure. No data collection. Just fast, beautiful image compression.

## Features

- **Drag & Drop** — Drop images directly onto the app
- **Browse Files** — Select images from your file system
- **Paste (Ctrl+V)** — Paste images directly from your clipboard
- **Batch Processing** — Compress multiple images at once
- **Live Preview** — Side-by-side comparison of original and compressed
- **Quality Slider** — Fine-tune compression from 10% to 100%
- **Format Conversion** — Convert between JPEG, PNG, WebP, and AVIF
- **Resize** — Scale by percentage or exact dimensions with aspect ratio lock
- **ZIP Download** — Download all compressed images as a single ZIP file
- **Dark Mode** — Seamless light/dark theme with system preference detection
- **Keyboard Navigation** — Full accessibility support
- **Privacy First** — Zero network requests for image processing

## Supported Formats

| Format | Input | Output |
|--------|-------|--------|
| JPEG   | Yes   | Yes    |
| PNG    | Yes   | Yes    |
| WebP   | Yes   | Yes    |
| AVIF   | Yes   | Yes*   |

\* AVIF output depends on browser support for `canvas.toBlob()` with AVIF MIME type.

## Technology Stack

- **TypeScript** — Strictly typed, zero `any`
- **Vite** — Lightning-fast development and optimized builds
- **Canvas API** — Native browser image compression
- **JSZip** — Client-side ZIP generation for batch downloads
- **CSS Custom Properties** — Dynamic theming without JavaScript frameworks

## Architecture

```
kontopress/
├── public/
│   └── images/
│       ├── logo.png
│       └── splash.png
├── src/
│   ├── app.ts              # Main application orchestrator
│   ├── compressor.ts       # Canvas-based image compression engine
│   ├── dragDrop.ts         # Drag, drop & paste handlers
│   ├── imageExporter.ts    # Download & ZIP export logic
│   ├── imageLoader.ts      # File validation & image loading
│   ├── main.ts             # Entry point
│   ├── notifications.ts    # Toast notification system
│   ├── preview.ts          # Side-by-side preview renderer
│   ├── quality.ts          # Quality slider component
│   ├── resize.ts           # Resize panel component
│   ├── storage.ts          # localStorage persistence
│   ├── theme.ts            # Dark/light mode manager
│   ├── types.ts            # TypeScript interfaces
│   ├── constants.ts        # Application constants
│   ├── utils.ts            # Shared utilities
│   └── styles/
│       └── main.css        # Complete stylesheet
├── index.html
├── splash.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Installation

```bash
# Clone the repository
git clone https://github.com/pr3nc2/kontopress.git
cd kontopress

# Install dependencies
npm install

# Start development server
npm run dev
```

## Development

```bash
npm run dev       # Start Vite dev server on http://localhost:3000
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Type-check without emitting
```

## Build

```bash
npm run build
```

The production build is output to the `dist/` directory. It is a static site that can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.).

## Deployment

Since Kontopress is a fully static application with no backend, deployment is straightforward:

### Vercel
```bash
npx vercel --prod
```

### Netlify
```bash
npx netlify deploy --prod --dir=dist
```

### GitHub Pages
Push the `dist/` folder to the `gh-pages` branch, or use GitHub Actions.

## Privacy

Kontopress processes all images locally in your browser using the HTML5 Canvas API. No image data is transmitted to any server. The application works entirely offline after the initial page load.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 94+     |
| Firefox | 93+     |
| Safari  | 16+     |
| Edge    | 94+     |

AVIF output requires browsers with AVIF encoding support (Chrome 106+, Firefox 121+).

## Changelog

### v1.0.0 — 2026-07-06

- Initial release
- Browser-based image compression (JPEG, PNG, WebP, AVIF)
- Drag & drop, file browse, and clipboard paste support
- Batch compression with ZIP download
- Side-by-side live preview with compression stats
- Quality slider with preset buttons
- Resize with aspect ratio lock and percentage scaling
- Format conversion between all supported formats
- Dark/light mode with system preference detection
- Keyboard navigation and accessibility support
- Privacy-first architecture — zero server dependencies

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with care by [PR3NC2](https://github.com/pr3nc2).
