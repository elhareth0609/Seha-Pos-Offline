const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
// Whitelist of allowed IPC channels
const validChannels = [
    'check-microphone',
    'start-recording',
    'stop-recording',
    'get-recording',
    'update-available',
    'update-downloaded',
    'download-progress',
    'update-error',
    'download-update',
    'install-update',
    'dialog:openFile', // Keep existing dialog channels
    'dialog:saveFile', // Keep existing dialog channels
    'toMain', // Keep existing toMain channel
    'fromMain', // Keep existing fromMain channel
    'network-status-changed', // Network status from main process
    'get-update-status', // Get current update status
    'print-component' // Request silent print
];

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, ...args) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, ...args);
            }
        },
        on: (channel, func) => {
            if (validChannels.includes(channel)) {
                const subscription = (_event, ...args) => func(...args);
                ipcRenderer.on(channel, subscription);
                return () => {
                    ipcRenderer.removeListener(channel, subscription);
                };
            }
        },
        once: (channel, func) => {
            if (validChannels.includes(channel)) {
                ipcRenderer.once(channel, (_event, ...args) => func(...args));
            }
        },
        invoke: (channel, ...args) => {
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, ...args);
            }
        },
    },
    versions: {
        node: () => process.versions.node,
        chrome: () => process.versions.chrome,
        electron: () => process.versions.electron,
        // Assuming 'app' is available in the main process and can be accessed via invoke if needed,
        // or if app.getVersion() is meant to be called in the main process and returned.
        // For a preload script, `app` is not directly available.
        // If app.getVersion() is intended to be exposed, it would typically be done via an IPC invoke.
        // For now, commenting out or adjusting based on typical preload context.
        // app: () => app.getVersion(), // This line would cause an error as 'app' is not defined here.
    },
    // Platform info (retained from original structure if still desired)
    platform: process.platform,
});

// Expose app version
contextBridge.exposeInMainWorld('appVersion', {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
});

// Expose process info for Electron detection
contextBridge.exposeInMainWorld('process', {
    type: 'renderer'
});