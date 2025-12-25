// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import node from '@astrojs/node';

// src/config.ts
export const API_BASE =
  import.meta.env.PUBLIC_API_BASE || "http://localhost:8000";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },

  integrations: [react()]
});