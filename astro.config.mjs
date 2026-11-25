// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://tizidaquan.blog',
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  build: {
    format: 'directory',
    assets: '_astro',
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [/** @type {any} */ (tailwindcss())],
  },
  devToolbar: {
    enabled: false,
  },
  server: {
    host: true,
    port: 4325,
  },
});
