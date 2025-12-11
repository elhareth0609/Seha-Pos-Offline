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
            preload: path.join(__dirname, 'preload.cjs'), // Use the new preload script
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
        icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
        show: false,
        autoHideMenuBar: true,
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        if (this.isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    // Check if this is the first launch
    const isFirstLaunch = !store.get('hasLaunched', false);

    // Load the app
    if (isDev) {
        // In development mode, we use the dev server URL
        mainWindow.loadURL(`http://localhost:9002`);
        mainWindow.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(indexPath);
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
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
