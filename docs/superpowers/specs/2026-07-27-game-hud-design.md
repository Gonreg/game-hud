# game-hud — общая HUD-библиотека для Telegram Mini App игр

**Дата:** 2026-07-27
**Статус:** согласовано, готово к планированию
**Этап:** 1 из 6 — библиотека + эталонная интеграция в fatman

---

## 1. Проблема

Шесть игр живут в отдельных репозиториях и повторяют друг друга во всём, что не является
игровой сценой: верхний HUD (лого, баланс, аватар, настройки), ввод суммы ставки и личный
кабинет на 12 экранов.

Кабинет скопирован четыре раза с дрейфом:

| репо | фронт | бэк | кабинет | строк CSS кабинета |
|---|---|---|---|---|
| fatman | React 18 + Vite, TS, алиас `@/` | Node + Prisma | `src/components/profile/*` | 626 |
| crash-race | React 18 + Vite, TS | Go | `src/profile/*` (копия fatman) | 1017 |
| matreshka | React 18 + Vite, JS + TS вперемешку | Go | `src/profile/*` | 978 |
| basketball | React 18 + Vite, JSX | Go | `src/profile/*` (копия matreshka) | 892 |
| molot | React 18 + Vite, TS, three.js | Go | `src/profile/*` (урезанный) | 376 |
| scratch-game | ванильный JS, без сборщика (jQuery + CreateJS) | Node | `js/app/profile/*` | 799 |

`ProfileHub.tsx` в basketball отличается от matreshka на ~10 содержательных строк.
crash-race — на форматирование и мелочи от fatman. Итого около 2400 строк TSX и 4700 строк
CSS продублированы шесть раз, и каждая правка требует шести проходов.

При этом REST-контракты бэков практически совпадают, несмотря на разные языки:
`/me`, `/me/stats`, `/me/stats/percentiles`, `/me/bets/history`, `/me/referrals`,
`/me/withdraw`, `/me/withdrawals`, `/me/notification-prefs`, `/me/support`,
`/leaderboard`, `/pay/deposit`.

### Кто источник истины

fatman — прародитель кабинета, но его фронт **заморожен с 3 июня 2026** (кроме панели звука
от 25 июля). Кабинет с тех пор эволюционировал в matreshka (правки по 24 июля) и crash-race
(по 26 июля): live-адрес TonConnect в меню кошелька, промо-карусель в кошельке, 11 типов
уведомлений, селекторы метрики и окна в лидерборде, markdown-рендер юридических документов.

Поэтому: **код берём покомпонентно из самой свежей реализации, визуал — из fatman.**

### Плейсхолдеров вместо игр нет

Проверено во всех шести репозиториях: у каждой живая игровая логика (matreshka — Canvas и
система частиц, fatman — Diver + Scene, molot — three.js, crash-race — three.js engine,
basketball — Canvas, scratch-game — CreateJS). Заглушки есть только внутри кабинета —
`ScreenComingSoon` в matreshka и basketball.

---

## 2. Решения

| вопрос | решение |
|---|---|
| границы библиотеки | чистый UI-kit, без сетевого кода |
| доставка | npm-пакет из GitHub по git-URL с тегом |
| состав | кабинет целиком + верхний HUD + ввод ставки + общая база |
| темизация | жёстко единый вид, без точек расширения |
| визуальный язык | fatman / JUBB |
| данные | адаптер-интерфейс, реализуемый игрой |
| скоуп раскатки | все шесть игр, по одной спеке на игру |
| эталонная интеграция | fatman |

---

## 3. Пакет и доставка

Отдельный git-репозиторий `Gonreg/game-hud`, локально
`/Users/ivan/PhpStormProjects/game-hud`. Игра подключает:

```json
"@gonreg/game-hud": "github:Gonreg/game-hud#v0.1.0"
```

`dist` собирается через vite lib mode + `vite-plugin-dts`. Сборка привязана к npm-скрипту
`prepare` — npm вызывает его при установке зависимости из git, поэтому `dist` в репозиторий
не коммитится. Тег в git = версия пакета; каждая игра обновляется, когда сама решит.

### Точки входа

```
@gonreg/game-hud             компоненты, хуки, типы
@gonreg/game-hud/styles.css  единая тема
@gonreg/game-hud/i18n        словари общих ключей (10 языков)
```

### Peer-зависимости

`react`, `react-dom`, `i18next`, `react-i18next`, `@tonconnect/ui-react`, `zustand` —
не бандлятся, берутся из игры. Все пять React-игр их уже имеют, мажорные версии совпадают.
scratch-game получит их вместе с внедрением сборщика (этап 6).

### Локальная разработка

`npm link` в игре, либо `file:../game-hud` в `overrides` — чтобы править либу и сразу
видеть результат.

### Рассмотрено и отвергнуто

- **Коммит `dist` в git.** Быстрее install, но мусор в истории и постоянные конфликты при
  мерже.
- **Source-only exports без сборки.** Vite неохотно транспилирует TSX внутри `node_modules` —
  хрупко и зависит от настроек `optimizeDeps` в каждой игре.
- **Git submodule.** Болезненно в обслуживании и CI, легко забыть `git submodule update`.
- **Скрипт синхронизации файлов.** Это та же копипаста, только автоматизированная — дрейф
  вернётся.

---

## 4. Состав библиотеки

```
src/
  hud/
    BalanceChip.tsx       баланс-пилюля, тап → кошелёк
    ProfileAvatarButton.tsx  аватар, тап → кабинет
    SettingsButton.tsx    шестерёнка + выпадающее меню
    SettingsMenu.tsx      музыка / SFX / как играть
    SoundSettings.tsx     панель звука
    TopBar.tsx            готовая раскладка из четырёх выше + лого-слот
  bet/
    BetAmountInput.tsx    степпер −/+ и горизонтальная карусель пресетов
    useBetAmount.ts       кламп по min/max/балансу, shake при невалидной сумме
  profile/
    ProfileShell.tsx      оверлей, шапка с назад/закрыть, Telegram BackButton
    ProfileHub.tsx        аватар + имя, полоса балансов, пополнить/вывести, меню
    WalletScreen.tsx      TonConnect, депозит, вывод, история выводов, промо-баннеры
    HistoryScreen.tsx     история ставок
    ReferralsScreen.tsx   реф-ссылка, список приглашённых, заработок
    StatsScreen.tsx       статистика + перцентили
    LeaderboardScreen.tsx лидерборд с селекторами метрики и временного окна
    NotificationsScreen.tsx  11 типов уведомлений
    LanguageScreen.tsx    выбор языка
    HelpScreen.tsx        саппорт: текст, тема, вложения
    LegalScreen.tsx       terms / privacy / offer с markdown-рендером
    LegalFooter.tsx
  wallet/
    WalletSheet.tsx       боттом-шит депозит/вывод (вызов из HUD)
  primitives/
    BottomSheet.tsx  Modal.tsx  InfoPopover.tsx  Skeleton.tsx  icons.tsx
  theme/
    styles.css            единая тема JUBB
    useTelegramSafeArea.ts
  i18n/
    locales/{en,ru,de,es,fr,hi,bn,ne,si,ur}.json
  adapter/
    types.ts              HudAdapter и модели данных
  store/
    hudStore.ts           zustand: какой экран открыт, открыт ли кошелёк
```

### TopBar — готовая раскладка, но не обязательная

Игры собирают верх по-разному. matreshka держит цельный `TopBar` (flex-строка: баланс
слева, аватар и шестерёнка справа). fatman рассыпает элементы абсолютным позиционированием:
`brand-row` с лого, `BalanceChip`, `ProfileAvatarButton` и `SoundSettings` — четыре
независимо спозиционированных узла.

Поэтому библиотека экспортирует и части, и сборку. `TopBar` — удобная раскладка в стиле
matreshka для тех, кому она подходит; fatman продолжает расставлять `BalanceChip` и
`ProfileAvatarButton` по-своему и `TopBar` не использует. Иначе первая же интеграция
поехала бы визуально, а критерий «любой diff = баг библиотеки» стал бы неприменим.

### Что НЕ входит

Игровая сцена, WebSocket и логика раундов, игровая CTA (кнопки ставки/кэшаута),
авторизация, любой HTTP-код.

### Почему CTA ставки остаётся в игре

Механики принципиально разные: matreshka — «Забрать» + предсказание больше/пусто,
fatman — cashout с автовыводом, basketball — слайдер дистанции, molot — свой цикл.
Универсальная CTA либо протечёт, либо станет заглушкой. А вот строка ввода суммы
(степпер и пресеты 0.1 / 0.5 / 1 / 5 / ×2 / MAX) уже дословно одинакова в matreshka,
crash-race и molot — её и забираем.

### Почему zustand, а не React context

Стор внутри библиотеки даёт императивный доступ из не-React кода: `hud.open('wallet')`.
Это обязательно для molot, где верхний HUD — статичная разметка `index.html` плюс
императивный `game/14-ui.ts`, и для scratch-game с его CreateJS-островом.
Стор держит только UI-состояние, никаких серверных данных.

---

## 5. Поток данных

Игра реализует один интерфейс:

```ts
interface HudAdapter {
  getMe(): Promise<Me>
  getStats(): Promise<Stats>
  getPercentiles(): Promise<Percentiles>
  getLeaderboard(mode: LeaderboardMode, window: LeaderboardWindow): Promise<Leaderboard>
  getReferrals(): Promise<Referrals>
  getBetHistory(limit: number): Promise<BetHistoryItem[]>
  getNotificationPrefs(): Promise<NotificationPrefs>
  putNotificationPrefs(prefs: NotificationPrefs): Promise<void>
  getDepositAddress(): Promise<Deposit>
  postWithdraw(amount: number, address: string): Promise<void>
  getWithdrawals(): Promise<Withdrawal[]>
  postSupport(text: string, theme: string, files: File[]): Promise<void>
}
```

и передаёт его в провайдер:

```tsx
<HudProvider
  adapter={myAdapter}
  config={{ botUsername, currency: 'GRAM', minBet, maxBet }}
>
  <App />
</HudProvider>
```

Скелетоны, состояния ошибок, ретраи и пагинация — внутри библиотеки. Сети в либе нет,
поэтому разные бэки (Go и Node) не мешают, а игра с нестандартным контрактом пишет свой
адаптер.

### Модели данных

За основу берутся типы fatman (`frontend/src/lib/api.ts`) — они самые полные и уже
типизированы: `Me`, `Stats`, `Percentiles`, `Leaderboard`, `LeaderboardEntry`,
`Referrals`, `ReferralInvitee`, `NotificationPrefs`, `Transaction`, `Deposit`.

### Известный компромисс

Модели становятся общим контрактом. Где бэк отдаёт другую форму — приводить в адаптере
игры.

**Единицы фиксируем жёстко:** адаптер обязан возвращать все денежные поля в дробных
единицах отображения — `1.5` означает полторы монеты. matreshka и molot хранят суммы в
нано-единицах (`1_500_000_000`), поэтому деление на `1e9` живёт в их адаптерах, а не в
библиотеке. Библиотека числа не интерпретирует — только форматирует одним форматтером,
а `config.currency` задаёт лишь подпись и значок (`GRAM`, `TON`).

Правило одностороннее и в обе стороны: суммы, которые библиотека отдаёт наружу
(`postWithdraw`, коллбэк ввода ставки), тоже дробные — обратную конвертацию в нано делает
адаптер.

---

## 6. Тема и CSS

Одна таблица стилей `@gonreg/game-hud/styles.css` — канон JUBB:

```
--hud-bg-0: #0b0d18       --hud-coral: #ff7a59     --hud-gold: #ffd35a
--hud-bg-1: #161a2e       --hud-teal: #2dd4bf      --hud-win: #5ee79b
--hud-ink: #f4f1ea        --hud-danger: #ff3a47
--hud-display: 'Bricolage Grotesque'
--hud-sans: 'Space Grotesk'
--hud-mono: 'JetBrains Mono'
```

Все селекторы под префиксом `hud-` (`.hud-profile-overlay`, `.hud-bal-chip`), чтобы не
сталкиваться с игровыми классами во время постепенной миграции.

Шрифты библиотека не импортирует — только объявляет переменные. `<link>` на Google Fonts
остаётся в `index.html` игры, иначе получим двойную загрузку там, где шрифт уже подключён.

### Два способа держать вьюпорт

| подход | игры | устройство |
|---|---|---|
| scaled stage | matreshka, basketball | фиксированный `#stage` 390×844 с `transform: scale()`; оверлеи внутри него, Telegram-инсеты надо делить на `--stage-scale-num` |
| full viewport | fatman, crash-race, molot | `phone-wrap` во весь экран, инсеты применяются как есть |

Библиотека не выбирает за игру. Компоненты — `position: absolute; inset: 0` внутри
контейнера, который дала игра; отступы читают `--hud-safe-top/right/bottom/left`.
Их пишет хук:

```ts
useTelegramSafeArea({ scaleVar?: string })
```

Он же держит фолбэк 88px сверху и 24px снизу для фуллскрина, где Telegram сообщает
`safeAreaInset.top = 0`, хотя его собственный хром висит поверх вьюпорта. Заплатка уже
существует в fatman (`App.tsx`), переносим как есть.

---

## 7. i18n

Пространства имён разделяются без пересечений:

- **библиотека:** `common`, `profile`, `wallet`, `history`, `stats`, `leaderboard`,
  `referrals`, `notifications`, `language`, `support`
- **игра:** `game`, `bet`, `round`, `result`, `sound`, `settings`, `legal`, `tweaks`

Библиотека экспортирует свои словари на 10 языках (en, ru, de, es, fr, hi, bn, ne, si, ur).
Игра сливает их со своими при инициализации i18next. Инстанс i18next остаётся игровым,
библиотека получает его через `useTranslation()`.

Если игра забыла подмешать словари, ключи покажутся сырыми — поэтому в dev-режиме
`HudProvider` проверяет наличие ключа `profile.title` и пишет ошибку в консоль.

---

## 8. Тестирование и проверка

**Юнит-тесты** (vitest + @testing-library/react), адаптер фейковый, сети нет:

- кламп суммы ставки по min / max / балансу; shake при невалидной сумме
- форматтеры денег, включая нано-единицы
- навигация ProfileShell: назад, закрытие, Telegram BackButton
- каждый экран кабинета на трёх состояниях адаптера: загрузка, данные, ошибка

**Demo-страница** — `npm run dev` внутри библиотеки поднимает страницу, где отрисованы
весь кабинет и HUD поверх фейкового адаптера. Заменяет сторибук и служит для визуальной
проверки глазами.

**Проверка интеграции** — fatman запускается в браузере, кабинет проходится вручную:
все 12 экранов, кошелёк, ввод ставки, лидерборд с переключением метрики и окна.

### Критерии готовности этапа 1

1. `npm run build` в game-hud проходит, `dist` содержит типы.
2. Юнит-тесты библиотеки зелёные.
3. fatman собирается (`tsc -b && vite build`) с библиотекой вместо локальных компонентов.
4. Из `fatman/frontend/src` удалены `components/profile/*`, `components/WalletSheet.tsx`,
   `components/BalanceChip.tsx`, `components/ProfileAvatarButton.tsx`,
   `components/SoundSettings.tsx`, `styles/profile.css` и осиротевшие после этого импорты.
5. В браузере кабинет fatman не отличается от текущего прода — **кроме апгрейдов**,
   которые он получает вместе с более свежим кодом из matreshka и crash-race:
   live-адрес TonConnect в строке кошелька, промо-карусель в кошельке, 11 типов
   уведомлений вместо текущего набора, селекторы метрики и окна в лидерборде,
   markdown-рендер юридических документов. Эти пять отличий ожидаемы; любое другое —
   баг библиотеки.

---

## 9. Этапы раскатки

Эта спека закрывает **этап 1**: библиотека плюс fatman, работающий на ней.
Дальше — по одной короткой спеке на игру, порядок по возрастанию риска.

| # | игра | работа | риск |
|---|---|---|---|
| 1 | **fatman** | эталонная интеграция; визуальный канон, поэтому любой визуальный diff = баг библиотеки | низкий |
| 2 | **crash-race** | кабинет почти дословно тот же, визуал уже JUBB — проверка переносимости | низкий |
| 3 | **matreshka** | перекраска с золота на коралл, первый прогон safe-area в scaled-режиме | средний |
| 4 | **basketball** | то же, что matreshka; кабинет отстаёт на пару фич и догонит бесплатно | средний |
| 5 | **molot** | верхний HUD переезжает из статики `index.html` и `14-ui.ts` в React-компоненты; развязка с игровым циклом three.js — основная работа | высокий |
| 6 | **scratch-game** | внедрение Vite + React ради HUD-слоя, CreateJS-игра остаётся императивным островом | высокий |

---

## 10. Риски

- **Регресс на живом проде.** Все шесть игр работают. Смягчение: каждая интеграция —
  отдельный этап с ручной проверкой в браузере до мержа.
- **scratch-game.** Перевод продакшена без сборщика на Vite — самая опасная часть плана.
  Если на месте окажется, что ванильный порт HUD дешевле, чем внедрение React, — сказать
  об этом до начала работы, а не после.
- **molot.** `14-ui.ts` переплетён с игровым циклом three.js; развязка может оказаться
  дороже, чем выглядит снаружи.
- **Смена визуала.** matreshka, molot и scratch-game сменят внешность: золото и Archivo
  уйдут в пользу коралла и Bricolage/Space Grotesk. Решение принято сознательно, но
  заметно игрокам.
- **Расхождение единиц.** matreshka считает в нано-единицах, fatman — в дробных.
  Ошибка в нормализации внутри адаптера даст неверный баланс на экране. Покрывается
  тестами форматтеров и ручной проверкой баланса при интеграции каждой игры.
