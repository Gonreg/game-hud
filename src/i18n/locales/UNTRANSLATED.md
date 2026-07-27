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

## Почему здесь английский текст, а не отсутствие ключа

Полагаться на `fallbackLng` в i18next нельзя: его настраивает игра, и настроен он
по-разному — `'en'` у fatman и molot, `['en', 'ru']` у matreshka, а у crash-race и
basketball `'ru'`. Убрав эти ключи, мы бы показали испаноязычному игроку в двух играх
из шести русский текст вместо английского. Поэтому английская строка лежит в словаре
явно, а не подставляется фолбэком.
