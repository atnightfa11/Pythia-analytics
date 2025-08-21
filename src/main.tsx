import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './pythia-buffer.js';

// Single initialization log for dev mode only
if (import.meta.env.DEV) {
  console.log('Analytics metrics initialized');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);