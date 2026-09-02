# Непереведённые ключи

Эти 12 ключей отсутствовали в `fatman/frontend/src/i18n/locales/<lang>.json` для восьми языков
(`es`, `de`, `fr`, `hi`, `ur`, `bn`, `si`, `ne`) и не нашлись также в
`matreshka/frontend/src/i18n/locales/<lang>.json` — либо потому что matreshka сама их не перевела
(английский текст остался как фолбэк), либо потому что фичи, к которым они относятся, в matreshka
нет вовсе (`wallet.deposit_info`, `wallet.withdraw_info`, `wallet.need_deposit_first`).

Для всех восьми языков подставлен английский текст из `en.json`, чтобы UI не показывал пустоту.
Перевод нужно будет донести отдельно.

Языки: `es`, `de`, `fr`, `hi`, `ur`, `bn`, `si`, `ne` (для каждого из этих 14 ключей — во всех восьми).

Ключи:

- `wallet.deposit_info`
- `wallet.withdraw_info`
- `wallet.need_deposit_first`
- `leaderboard.window_3d`
- `leaderboard.window_14d`
- `referrals.agency_cta_text`
- `referrals.agency_cta_btn`
- `notifications.withdraw_confirmed`
- `notifications.withdraw_failed`
- `notifications.cashback_credited`
- `notifications.bonus_expiring`
- `notifications.referral_big_win`
- `wallet.promo_title` (Task 12: перенос из matreshka, где переведён только для `en`/`ru`)
- `wallet.bonus_note` (Task 12: перенос из matreshka, где переведён только для `en`/`ru`)

## history.status.* (второй экран истории — раунды, Task 20)

Ключи `history.status.cashed`, `history.status.completed`, `history.status.empty_won`,
`history.status.busted` переведены только на `en` и `ru`: русский текст взят из
matreshka (`STATUS_LABELS` в `frontend/src/profile/HistoryScreen.tsx`), где он был
захардкожен прямо в компоненте, а не в словаре, и переведён только на два языка тем же
образом, что и `sound.*` выше.

Для остальных восьми языков (`es`, `de`, `fr`, `hi`, `ur`, `bn`, `si`, `ne`) подставлен
английский текст — по той же причине, что и везде в этом файле: полагаться на
`fallbackLng` нельзя, он разный по играм (`'ru'` у crash-race и basketball).

Статусы взяты из matreshka как пример; конкретный бэк волен присылать любую свою
строку — экран переводит её через `t('history.status.' + status, { defaultValue:
status })`, так что непереведённый статус покажет сырое слово, а не сломает экран.

## history.status.won/lost/refunded (basketball, Task 21)

У basketball статусы раунда свои — `won`, `lost`, `refunded` (internal/httpapi/stats.go),
и без словарной записи проваливались в `defaultValue` — сырое английское слово вместо
перевода на любом языке. `won`/`lost`/`refunded` переведены на `en` и `ru` вручную.

В `basketball/frontend/src/i18n/locales/<lang>.json` для этих статусов нет перевода ни
на одном из десяти языков вовсе (там нет ключа `history.status.*`: экран самой игры для
этих статусов тоже полагается на `defaultValue` библиотеки) — переносить неоткуда.
Поэтому для восьми языков (`es`, `de`, `fr`, `hi`, `ur`, `bn`, `si`, `ne`) подставлен
английский текст — по той же причине, что и везде в этом файле: полагаться на
`fallbackLng` нельзя, он разный по играм.

## Почему здесь английский текст, а не отсутствие ключа

Полагаться на `fallbackLng` в i18next нельзя: его настраивает игра, и настроен он
по-разному — `'en'` у fatman и molot, `['en', 'ru']` у matreshka, а у crash-race и
basketball `'ru'`. Убрав эти ключи, мы бы показали испаноязычному игроку в двух играх
из шести русский текст вместо английского. Поэтому английская строка лежит в словаре
явно, а не подставляется фолбэком.

## sound.* (панель звука, Task 19 — доработка после ревью)

Ключи `sound.title`, `sound.music`, `sound.sfx`, `sound.how`
переведены только на `en` и `ru`: панель звука была частью каждой игры до Task 19, и
на момент миграции в библиотеку переведена в исходниках (`F/i18n/locales/<lang>.json` →
`sound.*`, `M/frontend/.../i18n/locales/<lang>.json` → `game.music`/`game.sfx`/...) только
для этих двух языков что у fatman, что у matreshka.

Для остальных восьми языков (`es`, `de`, `fr`, `hi`, `ur`, `bn`, `si`, `ne`) перевода нет
ни в одном источнике, поэтому подставлен английский текст — по той же причине, что и
выше: полагаться на `fallbackLng` нельзя, он разный по играм.

`sound.track_*` (названия музыкальных треков) в библиотеку не переносятся вовсе — их
знает только звуковой движок игры.
