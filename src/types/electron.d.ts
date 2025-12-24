// TypeScript definitions for Electron window object

interface UpdateInfo {
    version: string;
    releaseDate?: string;
}

interface ProgressInfo {
    percent: number;
    transferred: number;
    total: number;
}

interface ElectronAPI {
    ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, func: (...args: any[]) => void) => (() => void) | void;
        once: (channel: string, func: (...args: any[]) => void) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
    versions: {
        node: () => string;
        chrome: () => string;
        electron: () => string;
    };
    platform: string;
}

declare global {
    interface Window {
        electron?: ElectronAPI;
        appVersion?: {
            node: string;
            chrome: string;
            electron: string;
        };
        isElectron?: boolean;
    }
}

export { };
