/**
 * Точные суммы: поля `<имя>Str` (с v1.4.0).
 *
 * Рядом с каждым показываемым денежным числом адаптер МОЖЕТ положить ту же
 * сумму точной десятичной строкой: `-?цифры[.цифры]`, точка, без разрядов и
 * экспоненты, обычно ровно `scale` знаков после точки («0.123456789012345678»).
 * Есть строка — кабинет печатает её (см. `fmtAmount`), нет — число, как всегда.
 *
 * Зачем. У валют со scale > 9 (ETH — 18) JSON-число не держит сумму: ставка
 * 0.123456789012345678 ETH доезжает числом 0.12345678901234568, и никакой
 * форматтер правду из него уже не достанет. Число при этом остаётся
 * обязательным: по нему кабинет берёт знак и сравнения (знак и равенство нулю
 * у double верны и на 18 знаках), и его одно читают пять Телеграм-игр,
 * которые про строки не знают и рисуются байт в байт как до v1.4.0.
 *
 * Строка обязана быть той же суммой, что число: кабинет не сверяет их, а
 * рисует строку, но цвет и «+/−» выбирает по числу.
 */
export interface Me {
  id: string;
  /** Идентификатор для отображения в профиле — у Telegram-игр это numeric
   *  Telegram user id, у игр без Telegram может быть тем же, что и `id`,
   *  сокращённым адресом кошелька или отсутствовать. Раньше — `tgId`. */
  displayId: string | null;
  /** Хэндл без «@», если есть — Telegram username и подобное. Раньше —
   *  `tgUsername`. */
  handle: string | null;
  /** Имя для отображения в профиле — Telegram first name, никнейм и т.п.
   *  Раньше — `tgFirstName`. */
  displayName: string | null;
  balance: number;
  balanceStr?: string;
  bonusBalance: number;
  bonusBalanceStr?: string;
  /** Сколько оборота осталось сыграть, чтобы удержание сняли и подарок стал
   *  выводимым. Необязательное: механика отыгрыша есть не у всех бэков, а
   *  отсутствие поля честнее нуля, который читается как «уже отыграно».
   *  Ноль при непустом `bonusBalance` означает именно отыгранный подарок. */
  wagerRemaining?: number;
  wagerRemainingStr?: string;
  /** Когда неотыгранный остаток бонуса сгорит — момент в ISO 8601
   *  (`2026-10-05T11:00:00Z`). Необязательное по той же причине, что и
   *  `wagerRemaining`: срока нет у бонусов без сгорания и у бэков без этой
   *  механики, и отсутствие поля означает «сгорать нечему», а не «уже сгорело». */
  bonusExpiresAt?: string;
  refBalance: number;
  refBalanceStr?: string;
  refCode: string | null;
  refLink: string | null;
  walletAddress: string | null;
}

export interface Transaction {
  id: string;
  kind: string;
  amount: number;
  amountStr?: string;
  /** Снимок баланса до и после проводки. Есть не у всех бэков: у crash-race
   *  гроссбух хранит только сумму, поэтому поля необязательные — лучше их
   *  отсутствие, чем ноль, который выглядит как настоящий баланс. */
  balanceBefore?: number;
  balanceAfter?: number;
  refId: string | null;
  createdAt: string;
}

export interface Stats {
  roundsPlayed: number;
  bestMultiplier: number;
  totalWagered: number;
  totalWageredStr?: string;
  totalWon: number;
  totalWonStr?: string;
  netProfit: number;
  netProfitStr?: string;
  winrate: number;
  bestStreak: number;
  avgBet: number;
  avgBetStr?: string;
  biggestWin: number;
  biggestWinStr?: string;
  /** Положительное число: экран сам ставит перед ним «−». */
  biggestLoss: number;
  biggestLossStr?: string;
  worstStreak: number;
  todayBets: number;
  todayProfit: number;
  todayProfitStr?: string;
  weekBets: number;
  weekProfit: number;
}

/**
 * Доли от нуля до единицы, а НЕ проценты: 0.8 значит «лучше 80% игроков».
 * Так считает бэк (`lo / sorted.length`), и экран статистики домножает на 100
 * сам. Адаптер, который отдаст сюда проценты, нарисует «лучше 8000%».
 */
export interface Percentiles {
  rounds: number | null;
  bestMult: number | null;
  winrate: number | null;
  profit: number | null;
  avgBet: number | null;
}

export interface ReferralInvitee {
  id: string;
  firstName: string | null;
  username: string | null;
  joinedAt: string;
  /** Без суффикса валюты: у matreshka это GRAM, а не TON. */
  earnedFromThem: number;
  earnedFromThemStr?: string;
}

export interface Referrals {
  refCode: string | null;
  refLink: string | null;
  invitedCount: number;
  totalEarned: number;
  totalEarnedStr?: string;
  ratePercent: number;
  refBalance: number;
  refBalanceStr?: string;
  invitees: ReferralInvitee[];
}

export type LeaderboardMode = 'profit' | 'multiplier' | 'turnover' | 'loss';
export type LeaderboardWindow = '1d' | '3d' | '7d' | '14d' | '30d' | 'all';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  username: string | null;
  profit: number;
  profitStr?: string;
  bestMultiplier: number;
  turnover: number;
  turnoverStr?: string;
  /** Положительное число: экран сам ставит перед ним «-». */
  loss: number;
  lossStr?: string;
  rounds: number;
  isFriend: boolean;
}

export interface Leaderboard {
  mode: LeaderboardMode;
  window: LeaderboardWindow;
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

/**
 * Snake_case здесь не ошибка: ключи совпадают один-в-один и с телом PUT-запроса
 * на бэк (адаптер отправляет объект как есть, без маппинга), и с i18n-ключами
 * `notifications.*`, по которым экран итерируется списком, а не хардкодит поля.
 * Приведение к camelCase потребовало бы менять контракт всех шести бэков и все
 * десять файлов локалей разом — ради нуля функциональной пользы.
 */
export interface NotificationPrefs {
  deposit_credited: boolean;
  withdraw_confirmed: boolean;
  withdraw_failed: boolean;
  referral_joined: boolean;
  referral_earned: boolean;
  referral_big_win: boolean;
  big_win_self: boolean;
  cashback_credited: boolean;
  bonus_expiring: boolean;
  inactive_48h: boolean;
  comeback_7d: boolean;
}

export interface Deposit {
  address: string;
  comment: string;
  note: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  amountStr?: string;
  status: string;
  address: string | null;
  /**
   * Когда вывод создан. Есть не у всех бэков: у molot обработчик не выбирает
   * колонку, хотя она в базе есть. Лучше не показать дату, чем показать
   * «Invalid Date», поэтому поле необязательное.
   */
  createdAt?: string;
}

/** Страница гроссбуха. Именована, потому что на этапе 3 появится второй такой же
 *  курсорный метод — история раундов. */
export interface TransactionPage {
  items: Transaction[];
  nextCursor: string | null;
}

/** Один сыгранный раунд в истории игрока. */
export interface GameRound {
  id: string;
  /** Сумма ставки в дробных единицах отображения. */
  bet: number;
  betStr?: string;
  /** Выплата; ноль, если раунд проигран. */
  payout: number;
  /** Кабинет показывает разность `payout − bet`. Пришли обе строки — она
   *  считается над ними в bigint, точно до последнего знака; не пришла хоть
   *  одна — по числам, как до v1.4.0. */
  payoutStr?: string;
  /** Коэффициент раунда. */
  coef: number;
  /** Исход в терминах игры: cashed, busted, won, lost и так далее. */
  status: string;
  /**
   * Когда раунд сыгран. Есть не у всех бэков: у basketball запрос истории
   * не выбирает временную метку вовсе. Лучше не показать дату, чем показать
   * «Invalid Date», поэтому поле необязательное.
   */
  createdAt?: string;
}

/** Квитанция вывода: экран показывает игроку короткий ID и статус сразу после
 *  отправки, поэтому postWithdraw обязан её вернуть, а не Promise<void>. */
export interface WithdrawTicket {
  id: string;
  status: string;
}

/** Квитанция обращения в поддержку: номер тикета и число принятых вложений
 *  попадают в сообщение об успешной отправке. */
export interface SupportTicket {
  ticketId: string;
  filesCount: number;
}

export type SupportTheme = 'finance' | 'game' | 'account' | 'bug' | 'partner' | 'other';

/**
 * Всё, что библиотека умеет попросить у игры. Сетевого кода внутри библиотеки
 * нет — каждая игра реализует этот интерфейс поверх своего бэка.
 *
 * Все денежные суммы — в дробных единицах отображения, в обе стороны.
 */
export interface HudAdapter {
  getMe(): Promise<Me>;
  getStats(): Promise<Stats>;
  getPercentiles(): Promise<Percentiles>;
  getLeaderboard(mode: LeaderboardMode, window: LeaderboardWindow): Promise<Leaderboard>;
  getReferrals(): Promise<Referrals>;
  getNotificationPrefs(): Promise<NotificationPrefs>;
  /**
   * Принимает объект целиком, а не патч. Бэки ведут себя по-разному: у
   * crash-race сохранение делает полную замену (`SET prefs = EXCLUDED.prefs`),
   * и патч из одного ключа стёр бы остальные настройки игрока. Полный объект
   * безопасен в обоих случаях, поэтому неоднозначности в контракте нет.
   */
  putNotificationPrefs(prefs: NotificationPrefs): Promise<NotificationPrefs>;
  getDeposit(): Promise<Deposit>;
  postWithdraw(amount: number, address: string | null): Promise<WithdrawTicket>;
  postSupport(text: string, theme: SupportTheme, files: File[]): Promise<SupportTicket>;

  /** Есть не у всех бэков — блок «привязать кошелёк» рендерится только с ним. */
  postWalletLink?(address: string): Promise<void>;
  /** Есть не у всех бэков — список выводов рендерится только с ним. */
  getWithdrawals?(): Promise<Withdrawal[]>;
  /**
   * Гроссбух: пополнения, выводы, ставки как проводки. Есть не у всех бэков —
   * у matreshka такого эндпоинта нет вовсе, там только история раундов.
   * Кабинет показывает пункт «История», если реализован хотя бы один из двух
   * методов, и рисует соответствующий экран.
   */
  getTransactions?(cursor?: string): Promise<TransactionPage>;
  /**
   * История сыгранных раундов. Альтернатива гроссбуху для игр, где финансовых
   * проводок наружу нет.
   */
  getGameHistory?(limit: number): Promise<GameRound[]>;
}

export interface HudConfig {
  /** Юзернейм бота без «@» — для футера уведомлений и подсказки в поддержке.
   *  Нет бота (например, у веб-игр без Telegram) — элементы, которые на него
   *  ссылаются, просто не рендерятся. */
  botUsername?: string;
  /** Подпись валюты на экранах: GRAM, TON. */
  currency: string;
  /**
   * Точность валюты — знаков после точки (EUR — 2, BTC — 8, ETH — 18). Без
   * неё суммы-числа печатаются с двумя знаками, как до v1.4.0, и пять
   * Телеграм-игр её не передают. С ней число печатается до `scale` знаков
   * без хвостовых нулей, минимум два, но не дальше девятого: дальше число
   * врёт, и точные знаки должна принести строка `<имя>Str`.
   *
   * Одна на весь кабинет, а не в каждой сумме: кабинет показывает одну валюту
   * (подпись `currency` тоже одна), и сумм другой валюты в нём не бывает.
   */
  scale?: number;
  minBet: number;
  maxBet: number;
  /**
   * Ключ localStorage, в который переключатель языка кладёт выбор игрока.
   * По умолчанию `i18nextLng` — ключ i18next-browser-languagedetector,
   * которым игра его и прочитает на следующем запуске.
   *
   * Игра, которая читает язык из своего ключа (у fatman это `tolstyak.lang`
   * в `detection.lookupLocalStorage`, у molot — `molot.lang` в собственном
   * детекторе без i18next-плагина), передаёт его сюда: иначе библиотека
   * запишет выбор в ключ, который никто не читает, и после перезапуска игра
   * снова определит язык сама.
   */
  languageStorageKey?: string;
}

/**
 * Мост к кошельку для игр, которые держат TonConnect у себя.
 *
 * По умолчанию библиотека работает с TonConnect сама, через React-хуки —
 * так устроены пять игр. Но scratch-game собран без сборщика и имеет
 * собственный ванильный TonConnect, который уже работает с деньгами; два
 * инстанса на странице конфликтуют. Такая игра передаёт мост, и библиотека
 * перестаёт трогать TonConnect вовсе.
 */
export interface HudWallet {
  /** Текущий подключённый адрес или null, если кошелёк не подключён. */
  getAddress(): string | null;
  /** Открыть окно подключения кошелька средствами игры. */
  connect(): Promise<void>;
  /**
   * Отправить перевод на адрес депозита. Сумма — в нано-единицах строкой,
   * как того требует TonConnect.
   */
  sendDeposit(to: string, amountNano: string, comment: string): Promise<void>;
  /**
   * Подписаться на смену адреса. Возвращает функцию отписки. Нужна, чтобы
   * экран перерисовался, когда игрок подключил или сменил кошелёк.
   */
  subscribe(onChange: (address: string | null) => void): () => void;
}
