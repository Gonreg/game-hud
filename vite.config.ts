// defineConfig берём из 'vitest/config', а не из 'vite': только там в типе есть
// поле `test`, иначе npm run typecheck падает на конфиге.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    // Без exclude плагин обходит весь src/ по глобу и генерирует .d.ts для
    // тестов и тестовых хелперов. Исполняемого .js для них в бандле нет, зато
    // IDE игры предложит автоимпорт из dist/test/fakeAdapter, который упадёт.
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        i18n: path.resolve(__dirname, 'src/i18n/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'i18next',
        'react-i18next',
        '@tonconnect/ui-react',
        'zustand',
      ],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
