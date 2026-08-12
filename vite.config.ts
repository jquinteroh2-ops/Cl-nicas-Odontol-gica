import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Genérico, para lo que no cae en ninguna de las áreas: `@/assets/...`.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@compartido': fileURLToPath(new URL('./src/compartido', import.meta.url)),
      '@componentes': fileURLToPath(new URL('./src/componentes', import.meta.url)),
      '@publico': fileURLToPath(new URL('./src/publico', import.meta.url)),
      '@paciente': fileURLToPath(new URL('./src/paciente', import.meta.url)),
      '@clinica': fileURLToPath(new URL('./src/clinica', import.meta.url)),
    },
  },
  server: {
    // host: true permite abrir el demo desde el celular en la misma red wifi.
    host: true,
    port: 5173,
  },
});
