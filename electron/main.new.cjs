const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
        icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
        show: false,
        autoHideMenuBar: true,
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Check if this is the first launch
    const isFirstLaunch = !store.get('hasLaunched', false);

    // Load the app
    if (isDev) {
        // In development mode, we use the dev server URL
        mainWindow.loadURL(`http://localhost:9002`);
        mainWindow.webContents.openDevTools();
    } else {
        // In production, we load the built index.html file
        const fs = require('fs');
        const indexPath = path.join(__dirname, '../dist/index.html');

        if (fs.existsSync(indexPath)) {
            // Register a custom file protocol to serve static assets
            protocol.registerFileProtocol('app', (request, callback) => {
                // Get the URL path after app://
                const urlPath = request.url.substr(6);

                // Handle static assets
                const filePath = path.join(__dirname, '../dist', urlPath === '/' ? 'index.html' : urlPath);
                callback({ path: filePath });
            });

            mainWindow.loadFile(indexPath);
        } else {
            console.error('Could not find index.html in dist folder');
            app.quit();
        }
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
