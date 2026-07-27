interface TelegramInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface TelegramWebApp {
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  };
  safeAreaInset?: TelegramInset;
  contentSafeAreaInset?: TelegramInset;
  isFullscreen?: boolean;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  ready?: () => void;
  expand?: () => void;
  openTelegramLink?: (url: string) => void;
}

interface Window {
  Telegram?: { WebApp: TelegramWebApp };
}
