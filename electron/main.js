const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const url = require('url');
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

    // Determine the route to load
    let route = 'login';
    if (isFirstLaunch) {
        route = 'welcome';
        store.set('hasLaunched', true);
    }

    // Load the app
    if (isDev) {
        mainWindow.loadURL(`http://localhost:9002/${route}`);
        mainWindow.webContents.openDevTools();
    } else {
        // Debug: Check what files are available FIRST
        const fs = require('fs');
        console.log('=== DEBUGGING FILE STRUCTURE ===');
        console.log('__dirname:', __dirname);
        console.log('app.getAppPath():', app.getAppPath());
        console.log('process.resourcesPath:', process.resourcesPath);
        
        // Check the out directory structure
        const outDir = path.join(__dirname, '../out');
        console.log('\nChecking out directory:', outDir);
        try {
            if (fs.existsSync(outDir)) {
                console.log('  ✓ EXISTS');
                const files = fs.readdirSync(outDir);
                console.log('  All files:', files);
                
                // Look for HTML files
                const htmlFiles = files.filter(f => f.endsWith('.html'));
                console.log('  HTML files:', htmlFiles);
                
                // Check for folders (Next.js with trailingSlash creates folders)
                const folders = files.filter(f => {
                    const stat = fs.statSync(path.join(outDir, f));
                    return stat.isDirectory();
                });
                console.log('  Folders:', folders);
            }
        } catch (err) {
            console.error('Error reading out directory:', err);
        }
        
        console.log('=== END DEBUG ===\n');

        // Determine the correct HTML file path
        // Next.js with trailingSlash creates: route/index.html
        // Next.js without trailingSlash creates: route.html
        let htmlPath;
        const possiblePaths = [
            `${route}.html`,           // e.g., login.html
            `${route}/index.html`,     // e.g., login/index.html
            `${route}`,                // folder name
        ];

        for (const testPath of possiblePaths) {
            const fullPath = path.join(outDir, testPath);
            if (fs.existsSync(fullPath)) {
                htmlPath = testPath;
                console.log('Found HTML at:', testPath);
                break;
            }
        }

        if (!htmlPath) {
            console.error('Could not find HTML file for route:', route);
            htmlPath = 'index.html'; // Fallback
        }

        // Register custom protocol to serve files from app.asar
        protocol.registerFileProtocol('app', (request, callback) => {
            let url = request.url.substr(6); // Remove 'app://'
            
            // Remove leading 'out/' if present since we're already in the out directory
            if (url.startsWith('out/')) {
                url = url.substr(4);
            }
            
            const filePath = path.normalize(`${__dirname}/../out/${url}`);
            console.log('Protocol handler - requested:', request.url, '-> resolved to:', filePath);
            callback({ path: filePath });
        });

        // Load using custom protocol
        console.log('Attempting to load:', `app://out/${htmlPath}`);
        mainWindow.loadURL(`app://out/${htmlPath}`);
        
        // Open DevTools to see what's happening
        mainWindow.webContents.openDevTools();

        // Debugging
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.error('Failed to load:', errorCode, errorDescription, validatedURL);
        });

        mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
            console.log(`[Renderer ${level}]:`, message);
            if (line) console.log(`  at line ${line} in ${sourceId}`);
        });

        mainWindow.webContents.on('did-finish-load', () => {
            console.log('Page loaded successfully');
            
            // Inject script to check for errors
            mainWindow.webContents.executeJavaScript(`
                console.log('=== CLIENT SIDE DEBUG ===');
                console.log('Location:', window.location.href);
                console.log('Document ready state:', document.readyState);
                console.log('Body exists:', !!document.body);
                console.log('=== END CLIENT DEBUG ===');
            `).catch(err => console.error('Failed to execute debug script:', err));
        });
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

// const { app, BrowserWindow, protocol } = require('electron');
// const path = require('path');
// const fs = require('fs');
// const Store = require('electron-store');

// const store = new Store();
// const isDev = !app.isPackaged;

// let mainWindow;

// function createWindow() {
//     mainWindow = new BrowserWindow({
//         width: 1400,
//         height: 900,
//         minWidth: 1024,
//         minHeight: 768,
//         webPreferences: {
//             preload: path.join(__dirname, 'preload.js'),
//             nodeIntegration: false,
//             contextIsolation: true,
//             webSecurity: true,
//         },
//         icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
//         show: false, // Don't show until ready
//         autoHideMenuBar: true, // Hide the menu bar (File, Edit, View)
//     });

//     // Show window when ready to avoid visual flash
//     mainWindow.once('ready-to-show', () => {
//         mainWindow.show();
//     });

//     // Check if this is the first launch
//     const isFirstLaunch = !store.get('hasLaunched', false);

//     // Determine the route to load
//     let route = '/login'; // Default to login
//     if (isFirstLaunch) {
//         route = '/welcome';
//         store.set('hasLaunched', true);
//     }

//     // Load the app
//     if (isDev) {
//         mainWindow.loadURL(`http://localhost:9002${route}`);
//     } else {
//         // Register a custom file protocol to serve static assets
//         protocol.registerFileProtocol('app', (request, callback) => {
//             // Get the URL path after app://
//             const urlPath = request.url.substr(6);

//             // Handle static assets from _next directory
//             if (urlPath.startsWith('/_next/')) {
//                 const filePath = path.join(__dirname, '../out', urlPath);
//                 callback({ path: filePath });
//                 return;
//             }

//             // Handle other files
//             const filePath = path.join(__dirname, '../out', urlPath === '/' ? 'index.html' : urlPath);
//             callback({ path: filePath });
//         });

//         // Read and modify the index.html to use our custom protocol
//         const indexPath = path.join(__dirname, '../out/index.html');
//         let indexContent = fs.readFileSync(indexPath, 'utf8');

//         // Replace absolute paths with our custom protocol
//         indexContent = indexContent.replace(/href="\/_next\//g, 'href="app:///_next/');
//         indexContent = indexContent.replace(/src="\/_next\//g, 'src="app:///_next/');
//         indexContent = indexContent.replace(/href="\//g, 'href="app:///');
//         indexContent = indexContent.replace(/src="\//g, 'src="app:///');

//         // Load the modified content
//         mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(indexContent));
//     }

//     // Open DevTools in development
//     if (isDev) {
//         mainWindow.webContents.openDevTools();
//     }

//     mainWindow.on('closed', () => {
//         mainWindow = null;
//     });
// }

// // App lifecycle
// app.whenReady().then(() => {
//     createWindow();

//     app.on('activate', () => {
//         // On macOS, re-create window when dock icon is clicked
//         if (BrowserWindow.getAllWindows().length === 0) {
//             createWindow();
//         }
//     });
// });

// app.on('window-all-closed', () => {
//     // On macOS, apps stay active until user quits explicitly
//     if (process.platform !== 'darwin') {
//         app.quit();
//     }
// });

// // Handle any uncaught exceptions
// process.on('uncaughtException', (error) => {
//     console.error('Uncaught Exception:', error);
// });
