// Отдельный конфиг для сборки без TonConnect (`dist/walletless.js`, подпуть
// `@gonreg/game-hud/walletless`) — для игр вроде JUBB Crash: кошелёк не TON
// (Phantom/Solflare на Solana), TonConnect им не нужен вовсе, и они всегда
// передают свой `HudWallet`-мост в `HudProvider` (см. `renderWallet`/`wallet`
// в HudProvider.tsx). Тот же приём, что и в vite.standalone.config.ts: alias
// подменяет './tonconnectHooks' на заглушку, поэтому `@tonconnect/ui-react`
// не попадает в граф зависимостей бандла и не импортируется — библиотека не
// падает без <TonConnectUIProvider> и не тянет пакет консьюмеру. В отличие от
// standalone (IIFE, всё внутри), здесь обычная библиотечная сборка формата
// 'es' с внешними React/i18next/zustand — тот же приём, что и в
// vite.config.ts, минус TonConnect.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
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
    // Общая сборка (vite.config.ts) кладёт сюда index/i18n раньше этой, а
    // build:standalone — свой standalone.js. Очистка каталога здесь стёрла
    // бы их.
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'walletless.js',
    },
    rollupOptions: {
      // Без '@tonconnect/ui-react' здесь: alias выше убирает единственный
      // файл, который на него ссылается (tonconnectHooks.ts), из графа этой
      // сборки, поэтому помечать его external незачем — импорта, который
      // нужно было бы вынести наружу, просто не возникает.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'i18next', 'react-i18next', 'zustand'],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
