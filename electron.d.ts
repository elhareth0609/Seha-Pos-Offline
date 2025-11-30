interface Window {
    electron: {
        platform: string;
        send: (channel: string, data: any) => void;
        receive: (channel: string, func: (...args: any[]) => void) => void;
        invoke: (channel: string, data?: any) => Promise<any>;
    };
    appVersion: {
        node: string;
        chrome: string;
        electron: string;
    };
}
