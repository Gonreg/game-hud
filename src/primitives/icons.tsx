// Hand-rolled stroke icons (1.5 weight, 24×24, currentColor). One quiet style
// across the whole profile module — no emoji.

import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

const base: Props = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const IconWallet = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z" />
    <path d="M3 9h15.5" />
    <circle cx="17" cy="14" r="1.25" />
  </svg>
);

export const IconHistory = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2" />
    <path d="M3.5 4v3.8H7.3" />
    <path d="M12 8v4l2.6 1.7" />
  </svg>
);

export const IconUsers = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="9" r="3.2" />
    <path d="M3 19.5c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
    <circle cx="16.5" cy="8" r="2.4" />
    <path d="M16 13.6c2.6.2 4.5 2 4.5 4.6" />
  </svg>
);

export const IconChart = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-8" />
    <path d="M3 20h18" />
  </svg>
);

export const IconTrophy = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
    <path d="M17 5h2.5a1.5 1.5 0 0 1 0 3H17" />
    <path d="M7 5H4.5a1.5 1.5 0 0 0 0 3H7" />
    <path d="M12 12v3" />
    <path d="M9 19h6l-.5-3h-5L9 19Z" />
  </svg>
);

export const IconBell = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const IconGlobe = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.5 3 2.5 14 0 17" />
    <path d="M12 3.5c-2.5 3-2.5 14 0 17" />
  </svg>
);

export const IconHelp = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1.4.9-1.4 1.7v.5" />
    <circle cx="11.5" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconChevron = (p: Props) => (
  <svg {...base} width={14} height={14} {...p}>
    <path d="M9 6l5 6-5 6" />
  </svg>
);

export const IconArrowLeft = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M14 7l-5 5 5 5" />
    <path d="M9 12h11" />
  </svg>
);

export const IconClose = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconGear = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconPlus = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconTon = (p: Props) => (
  <svg width={14} height={14} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" {...p}>
    <circle cx="28" cy="28" r="28" fill="#0098EA" />
    <path
      d="M37.5604 15.6403H18.4385C14.9237 15.6403 12.6948 19.4296 14.4632 22.4929L26.2644 42.9534C27.0345 44.2877 28.9644 44.2877 29.7345 42.9534L41.5384 22.4929C43.3041 19.4351 41.0752 15.6403 37.5631 15.6403H37.5604ZM26.2563 36.8602L23.6856 31.8849L17.4823 20.7892C17.0732 20.0795 17.5795 19.1722 18.4358 19.1722H26.2536V36.8629L26.2563 36.8602ZM38.5089 20.7865L32.3083 31.8876L29.7376 36.8602V19.1695H37.5554C38.4117 19.1695 38.918 20.0768 38.5089 20.7865Z"
      fill="white"
    />
  </svg>
);

export const IconBall = (p: Props) => (
  <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth={1.5} {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 2.5v19M2.5 12h19M5 5c3.5 3 3.5 11 0 14M19 5c-3.5 3-3.5 11 0 14" />
  </svg>
);

export const IconX = (p: Props) => (
  <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
