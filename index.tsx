
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import AppRouter from './Router';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

document.getElementById('seo-static-fallback')?.remove();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
