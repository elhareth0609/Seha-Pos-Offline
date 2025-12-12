import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initElectronStorage, initElectronNetwork } from './lib/electron-init';

// Initialize Electron-specific features
initElectronStorage();
initElectronNetwork();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
