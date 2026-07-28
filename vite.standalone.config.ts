// Отдельный конфиг для самодостаточного бандла (`dist/standalone.js`), а не
// режим в vite.config.ts: у "родной" сборки формат 'es' с внешними React/
// i18next/zustand, а тут — единственный IIFE-файл, где эти же пакеты обязаны
// быть внутри. Смешивать это через build.lib.formats на одном entry-объекте
// нельзя (у каждого формата свой набор externals), а мешать выбор режима с
// vite's `mode` означало бы потерять автоматическую production-подстановку
// process.env.NODE_ENV у React (она завязана на mode=production, а не на имя
// нашего кастомного режима) — поэтому отдельный файл и отдельный вызов
// `vite build --config vite.standalone.config.ts` с обычным mode=production.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  // Vite's default NODE_ENV replacement не всегда достаёт до CJS-веток внутри
  // react/react-dom в lib-режиме (проверено эмпирически: без явного define
  // в бандл попадает целиком react-dom.development.js с dev-предупреждениями
  // — см. отчёт). Явный define — обычный обходной путь для lib+iife сборок.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: [
      // @tonconnect/ui-react не должен попасть в бандл вовсе — у scratch-game
      // свой ванильный TonConnect. Подменяем заглушкой везде, где на файл
      // ссылаются относительным путём: из src/wallet (useHudWallet.ts,
      // WalletSheet.tsx) это './tonconnectHooks', из src/profile
      // (WalletScreen.tsx) — '../wallet/tonconnectHooks'. RegExp-find тут не
      // подходит: у @rollup/plugin-alias с ним ломается резолюция абсолютного
      // replacement (получается './/Users/...'), поэтому два точных литерала.
      {
        find: './tonconnectHooks',
        replacement: path.resolve(__dirname, 'src/wallet/tonconnectHooks.stub.ts'),
      },
      {
        find: '../wallet/tonconnectHooks',
        replacement: path.resolve(__dirname, 'src/wallet/tonconnectHooks.stub.ts'),
      },
    ],
  },
  build: {
    outDir: 'dist',
    // Общая сборка (vite.config.ts) кладёт сюда index/i18n раньше этой —
    // очистка каталога здесь стёрла бы их.
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: false,
    minify: true,
    lib: {
      entry: path.resolve(__dirname, 'src/standalone.ts'),
      name: 'GameHud',
      formats: ['iife'],
      fileName: () => 'standalone.js',
    },
    // React, ReactDOM, i18next, react-i18next, zustand остаются внутри —
    // никакого rollupOptions.external здесь: этот бандл самодостаточен.
  },
});
