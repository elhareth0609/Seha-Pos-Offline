const { app, BrowserWindow, protocol, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

const store = new Store();
const isDev = !app.isPackaged;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user choose
autoUpdater.autoInstallOnAppQuit = true; // Install when app closes

let mainWindow;
let updateModel = {
    status: 'idle', // idle, checking, available, not-available, downloading, downloaded, error
    info: null,
    progress: null,
    error: null
};

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
            webSecurity: true,
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
        const indexPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(indexPath);

        // mainWindow.loadURL(`http://localhost:3000`);
        mainWindow.webContents.openDevTools();
    } else {
        // In production mode, we need to handle the file protocol properly
        const indexPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(indexPath);

        // Handle navigation to prevent file:// protocol errors
        mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl);

            // Allow only http, https, and file protocols
            if (parsedUrl.origin !== 'file://' && !parsedUrl.origin.startsWith('http')) {
                event.preventDefault();
            }
        });
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

    // NOTE: Removed DNS-based connectivity checks as they were unreliable
    // DNS lookups can succeed due to caching even when HTTP requests fail
    // The app now relies on API request failures to detect offline mode
}

app.whenReady().then(() => {
    createWindow();

    // Check for updates after app starts (only in production)
    if (!isDev) {
        console.log('Checking for updates...');
        setTimeout(() => {
            autoUpdater.checkForUpdates();
        }, 3000); // Wait 3 seconds after launch
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ============= AUTO-UPDATER EVENTS =============

autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
    updateModel.status = 'checking';
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    updateModel.status = 'available';
    updateModel.info = info;
    if (mainWindow) {
        mainWindow.webContents.send('update-available', {
            version: info.version,
            releaseDate: info.releaseDate
        });
    }
});

autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.');
    updateModel.status = 'not-available';
    updateModel.info = info;
});

autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
    updateModel.status = 'error';
    updateModel.error = error.message;
    if (mainWindow) {
        mainWindow.webContents.send('update-error', error.message);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
    updateModel.status = 'downloading';
    updateModel.progress = progressObj;
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', {
            percent: progressObj.percent,
            transferred: progressObj.transferred,
            total: progressObj.total
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    updateModel.status = 'downloaded';
    updateModel.info = info;
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', {
            version: info.version
        });
    }
});

// ============= IPC HANDLERS =============

ipcMain.on('download-update', () => {
    console.log('User requested update download');
    autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
    console.log('User requested update installation');
    autoUpdater.quitAndInstall();
});

ipcMain.handle('get-update-status', () => {
    return updateModel;
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

