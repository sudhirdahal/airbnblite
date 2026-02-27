import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * ============================================================================
 * VITE BUILD CONFIGURATION (The Module Orchestrator)
 * ============================================================================
 * This file manages the development and production build pipeline.
 * Logic:
 * 1. HMR (Hot Module Replacement): Fast updates without full page refreshes.
 * 2. Bundling: Compresses and optimizes JS/CSS for production speed.
 * 3. Environment: Loads .env variables into the VITE_ prefix namespace.
 */
export default defineConfig({
  plugins: [
    /**
     * REACT PLUGIN
     * Enables JSX transformation and high-fidelity development features 
     * like Fast Refresh.
     */
    react()
  ],
  
  /* --- HISTORICAL STAGE 1: BOILERPLATE CONFIG ---
   * export default defineConfig({
   *   plugins: [react()]
   * })
   * // Problem: Lacked deep documentation for architectural decisions!
   */

  server: {
    // Optional: Dev server configurations (proxy, port, etc.)
    port: 5173,
    strictPort: true,
  },

  build: {
    // Optimization settings for the production 'dist' folder
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
});
