import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://aisolutionsblue.com',
  adapter: vercel(),
  security: { checkOrigin: true },
});
