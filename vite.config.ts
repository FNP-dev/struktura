import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { nitro } from 'nitro/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nitro(),
    babel({ presets: [reactCompilerPreset()] })
  ],  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})


