import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@clawwork/shared', '@clawwork/core'] })],
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ['@clawwork/shared', '@clawwork/core'] })],
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
      },
    },
    css: {
      transformer: 'lightningcss',
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          'quick-launch': resolve('src/renderer/quick-launch.html'),
        },
      },
    },
  },
});
