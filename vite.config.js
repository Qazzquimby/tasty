import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Relative base so the build works on GitHub Pages under /tasty/ or anywhere else.
export default defineConfig({
  base: './',
  plugins: [svelte()],
});
