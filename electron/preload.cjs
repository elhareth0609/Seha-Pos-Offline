const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Platform info
    platform: process.platform,

    // IPC communication (add methods as needed)
    send: (channel, data) => {
        // Whitelist channels
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    receive: (channel, func) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },

    invoke: async (channel, data) => {
        const validChannels = ['dialog:openFile', 'dialog:saveFile'];
        if (validChannels.includes(channel)) {
            return await ipcRenderer.invoke(channel, data);
        }
    },
});

// Expose app version
contextBridge.exposeInMainWorld('appVersion', {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
});
