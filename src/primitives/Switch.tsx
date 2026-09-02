/**
 * Визуальный iOS-style тумблер (трек + бегунок), без своей интерактивности.
 * Используется внутри уже кликабельного контейнера — строки-кнопки в
 * `SettingsMenu`/`SoundSettings`, которая и несёт `role="switch"`,
 * `aria-checked` и клавиатуру (нативный `<button>` обрабатывает Enter/Space
 * сам). Вложенный интерактивный элемент внутри кнопки был бы невалидным
 * HTML, поэтому доступность — на предке, а этот компонент только рисует.
 */
export function Switch({ checked }: { checked: boolean }) {
  return <span className={'hud-switch' + (checked ? ' hud-on' : '')} aria-hidden="true" />;
}
