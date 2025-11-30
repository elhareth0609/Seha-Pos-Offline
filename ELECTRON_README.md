# Seha POS Offline - Electron Desktop App

This is a desktop application built with Next.js and Electron.js.

## Development

To run the app in development mode:

```bash
npm run electron:dev
```

This will:
1. Start the Next.js development server on port 9002
2. Wait for the server to be ready
3. Launch the Electron window

## Building

To build the production desktop app:

```bash
npm run electron:build
```

This will:
1. Build the Next.js app as a static export
2. Package the Electron app with electron-builder
3. Create an installer in the `dist/` folder

## Testing Production Build

To test the production build locally without creating an installer:

```bash
npm run electron:start
```

Note: You need to run `npm run build` first to generate the static files.

## Project Structure

```
Seha-Pos-Offline/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script for IPC
├── src/                 # Next.js application
├── public/              # Static assets
├── out/                 # Next.js static export (generated)
├── dist/                # Electron build output (generated)
└── electron-builder.json # Electron builder configuration
```

## Available Scripts

- `npm run dev` - Run Next.js dev server only
- `npm run electron:dev` - Run Electron app in development mode
- `npm run build` - Build Next.js static export
- `npm run electron:build` - Build production Electron app
- `npm run electron:start` - Start Electron with built files

## Distribution

The built installer will be in the `dist/` folder:
- Windows: `.exe` installer
- macOS: `.dmg` installer (requires building on macOS)
- Linux: `.AppImage` or `.deb` (requires building on Linux)
