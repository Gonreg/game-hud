/**
 * Standalone-бандл (`src/standalone.ts`) вшивает CSS темы в JS через `?inline`,
 * чтобы scratch-game не пришлось подключать отдельный файл стилей. У самого
 * Vite (`vite/client.d.ts`) есть амбиентный модуль для голого `*.css`, но не
 * для `*.css?inline` — без этого объявления `tsc --noEmit` не находит тип
 * импорта.
 */
declare module '*.css?inline' {
  const css: string;
  export default css;
}
