import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './App.css'; // Global high-fidelity utilities

/**
 * ============================================================================
 * FRONTEND ENTRY POINT (The Application Bootloader)
 * ============================================================================
 * This is the 'Root' of the React component tree.
 * Logic: Utilizes the concurrent rendering engine (createRoot) to mount
 * the App component into the #root element of index.html.
 * 
 * Safety: Wrapped in <React.StrictMode> to detect side-effects and 
 * legacy API usage during development.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/* --- HISTORICAL STAGE 1: LEGACY MOUNTING ---
 * ReactDOM.render(<App />, document.getElementById('root'));
 * // Problem: Legacy React 17 API did not support concurrent features!
 */
