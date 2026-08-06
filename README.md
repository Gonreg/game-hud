# @gonreg/game-hud

Общий игровой интерфейс (профиль, кошелёк, история, поддержка), общий для
нескольких игр — как на Telegram/TON, так и веб-игр без Telegram и без TON.

## Кошелёк без TonConnect

Игры с собственным кошельком (не TonConnect — например, Phantom/Solflare на
Solana) подключают библиотеку через отдельный подпуть:

```ts
import { HudProvider, ProfileShell } from '@gonreg/game-hud/walletless';
```

Этот вход собран с той же заглушкой TonConnect, что и standalone-бандл:
`@tonconnect/ui-react` не попадает в граф зависимостей и не импортируется, а
`HudProvider` не требует `<TonConnectUIProvider>` в дереве — профиль
открывается и без него. Публичный API идентичен обычному входу
(`@gonreg/game-hud`); передайте свой `wallet: HudWallet` в `HudProvider`,
чтобы подключение и переводы работали через ваш кошелёк (см. `HudWallet` в
`src/adapter/types.ts`).

Обычный вход (`@gonreg/game-hud`) не изменился: `@tonconnect/ui-react`
по-прежнему используется напрямую и нужен в рантайме, хотя формально помечен
`optional` в `peerDependenciesMeta` — чтобы npm не требовал его у тех, кто
поставил только `/walletless`.

## Свой экран кассы

`HudProvider` принимает необязательный проп `renderWallet?: () => ReactNode`.
Если он передан, кабинет (`ProfileShell`) на экране «Кошелёк» рендерит его
вместо встроенного `WalletScreen` — сразу во всех точках входа (баланс-чип,
пункт меню, обе кнопки быстрого доступа в профиле), без необходимости
патчить внутренний стор библиотеки:

```tsx
<HudProvider
  adapter={adapter}
  config={config}
  wallet={wallet}
  renderWallet={() => <MyCashierScreen />}
>
  <ProfileShell />
</HudProvider>
```

## Выбор языка в настройках

Меню шестерёнки (`SettingsMenu`, `SoundSettings`) последним пунктом показывает
выбор языка: свёрнутая строка с текущим языком, по тапу — список десяти локалей
названиями на самих языках. Игре передавать для этого ничего не надо, довольно
обновить версию библиотеки. Игре со своим меню настроек тот же пункт доступен
отдельным экспортом:

```tsx
import { LanguagePicker } from '@gonreg/game-hud';
```

Выбор применяется сразу (`i18n.changeLanguage`, `lang`/`dir` на `<html>`) и
пишется в `localStorage`. Ключ по умолчанию — `i18nextLng`, как у
`i18next-browser-languagedetector`. Игра, которая читает язык из своего ключа,
называет его в конфиге, иначе выбор не переживёт перезапуск:

```tsx
<HudProvider config={{ ...config, languageStorageKey: 'tolstyak.lang' }}>
```

## Миграция на 1.0

Версия 1.0 убирает Telegram-специфичные поля из публичного API, чтобы
библиотеку могла подключить и игра без Telegram.

### `Me`

| было | стало |
| --- | --- |
| `tgId: string` | `displayId: string \| null` |
| `tgUsername: string \| null` | `handle: string \| null` |
| `tgFirstName: string \| null` | `displayName: string \| null` |

Значения не меняются — меняются только имена полей. Обновите реализацию
`HudAdapter.getMe()` в своей игре, подставив новые имена вместо старых.

### `HudConfig`

| было | стало |
| --- | --- |
| `botUsername: string` (обязательное) | `botUsername?: string` (необязательное) |

Без `botUsername` элементы, которые на него ссылаются (подсказка в
поддержке, футер уведомлений со ссылкой на бота), просто не рендерятся —
вместо битой ссылки на несуществующего бота.
