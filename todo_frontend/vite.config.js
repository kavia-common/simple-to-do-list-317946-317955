import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the todo_frontend React SPA.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true
  }
});
