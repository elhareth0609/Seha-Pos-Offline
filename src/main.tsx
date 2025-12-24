import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initElectronStorage, initElectronNetwork } from './lib/electron-init';
import { startNetworkChecks } from './lib/network-checker';

// Initialize Electron-specific features
initElectronStorage();
initElectronNetwork();

// Start periodic network checks
startNetworkChecks();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
