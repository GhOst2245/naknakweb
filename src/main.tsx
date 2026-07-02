import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR WebSocket errors and Firestore BloomFilter/IndexedDB errors in sandbox environments
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = event.reason ? String(event.reason.message || event.reason) : '';
  if (
    reasonStr.includes('WebSocket') || 
    reasonStr.includes('vite') || 
    reasonStr.includes('websocket') ||
    reasonStr.includes('BloomFilter') ||
    reasonStr.includes('bloom') ||
    reasonStr.includes('IndexedDB')
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
    console.warn('Suppressed benign sandbox environment error:', reasonStr);
  }
});

window.addEventListener('error', (event) => {
  const messageStr = event.message ? String(event.message) : '';
  if (
    messageStr.includes('WebSocket') || 
    messageStr.includes('vite') || 
    messageStr.includes('websocket') ||
    messageStr.includes('BloomFilter') ||
    messageStr.includes('bloom') ||
    messageStr.includes('IndexedDB')
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
    console.warn('Suppressed benign sandbox environment error:', messageStr);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
