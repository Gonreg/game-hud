import { useId, type SVGProps } from 'react';

/**
 * Мультяшный «объёмный» подарок для кнопки бонусов. Нарисован руками в SVG —
 * без картинок и внешних ассетов, чтобы не тащить в пять Телеграм-игр лишний
 * запрос и не зависеть от CDN.
 *
 * Объём держится на трёх приёмах: у каждой грани свой градиент сверху вниз
 * (свет падает сверху-слева), у коробки есть тёмная правая грань и
 * внутренняя тень под крышкой, а по краям — белые блики. Под коробкой мягкая
 * тень-эллипс, чтобы иконка «стояла», а не висела.
 *
 * id градиентов уникальны на экземпляр (useId): иконка стоит и на кнопке, и в
 * карточке карусели, и одинаковые id на странице ссылались бы на градиенты
 * первого экземпляра — второй перекрашивался бы, стоило первому исчезнуть.
 */
export function GiftIcon3D(props: SVGProps<SVGSVGElement>) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `hud-gift-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  return (
    <svg viewBox="0 0 64 64" width={40} height={40} aria-hidden="true" focusable="false" {...props}>
      <defs>
        <radialGradient id={id('shadow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('box')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5f86" />
          <stop offset="55%" stopColor="#f0356b" />
          <stop offset="100%" stopColor="#b8184f" />
        </linearGradient>
        <linearGradient id={id('side')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={id('lid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8aa6" />
          <stop offset="100%" stopColor="#e63368" />
        </linearGradient>
        <linearGradient id={id('ribbon')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff2a8" />
          <stop offset="45%" stopColor="#ffd23f" />
          <stop offset="100%" stopColor="#e89a12" />
        </linearGradient>
        <linearGradient id={id('bow')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe98a" />
          <stop offset="100%" stopColor="#f2a516" />
        </linearGradient>
        <radialGradient id={id('knot')} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff6c4" />
          <stop offset="60%" stopColor="#ffc933" />
          <stop offset="100%" stopColor="#d98a0c" />
        </radialGradient>
      </defs>

      {/* Тень на «полу» */}
      <ellipse cx="32" cy="58.5" rx="21" ry="3.6" fill={url('shadow')} />

      {/* Коробка: лицевая грань, затенённая правая часть, внутренняя тень под крышкой */}
      <rect x="12" y="29" width="40" height="27" rx="5.5" fill={url('box')} />
      <rect x="12" y="29" width="40" height="27" rx="5.5" fill={url('side')} />
      <rect x="12" y="29" width="40" height="5" fill="#7a0f36" opacity="0.35" />
      {/* Блик на левой кромке коробки */}
      <path d="M16 36 v14 a3 3 0 0 0 3 3" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.2"
        strokeLinecap="round" fill="none" />

      {/* Вертикальная лента на коробке */}
      <rect x="27.5" y="29" width="9" height="27" fill={url('ribbon')} />
      <rect x="28.6" y="31" width="1.8" height="22" rx="0.9" fill="#fff" opacity="0.55" />

      {/* Крышка чуть шире коробки — даёт свес и ощущение объёма */}
      <rect x="8.5" y="21" width="47" height="12" rx="4.5" fill={url('lid')} />
      <rect x="8.5" y="21" width="47" height="12" rx="4.5" fill={url('side')} opacity="0.6" />
      <rect x="11.5" y="22.6" width="36" height="2.6" rx="1.3" fill="#fff" opacity="0.4" />
      <rect x="27" y="21" width="10" height="12" fill={url('ribbon')} />
      <rect x="28.2" y="22.4" width="2" height="9" rx="1" fill="#fff" opacity="0.6" />

      {/* Бант: две петли, их внутренняя тень, блик и узел */}
      <path d="M32 20 C24 8, 11 11, 16 18 C19 22, 27 21.5, 32 20 Z" fill={url('bow')} />
      <path d="M32 20 C40 8, 53 11, 48 18 C45 22, 37 21.5, 32 20 Z" fill={url('bow')} />
      <path d="M31 19.5 C26 13.5, 19 13.5, 19.5 17 C22 19.6, 27.5 19.8, 31 19.5 Z" fill="#c9780a" opacity="0.55" />
      <path d="M33 19.5 C38 13.5, 45 13.5, 44.5 17 C42 19.6, 36.5 19.8, 33 19.5 Z" fill="#c9780a" opacity="0.55" />
      <path d="M18.2 13.6 C20.5 11.6, 24 12, 26 13.4" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4"
        strokeLinecap="round" fill="none" />
      <circle cx="32" cy="20" r="4.3" fill={url('knot')} />
      <circle cx="30.6" cy="18.6" r="1.3" fill="#fff" opacity="0.85" />

      {/* Искорки */}
      <path d="M9 9 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill="#fff" opacity="0.9" />
      <path d="M55 6 l0.8 2 2 0.8 -2 0.8 -0.8 2 -0.8 -2 -2 -0.8 2 -0.8 Z" fill="#ffe27a" />
      <circle cx="57" cy="24" r="1.2" fill="#fff" opacity="0.8" />
    </svg>
  );
}
