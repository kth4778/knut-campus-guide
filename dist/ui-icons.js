// 이모지 대신 쓰는 선 아이콘과 그림 경로. 이모지는 기기마다 모양이 다르고, 글꼴이 없으면 네모로 깨져 보여요.
const svg = (d, extra = '') => `<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;

export const ICON = {
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  chat: svg('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/>'),
  users: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M16 5.3a3 3 0 0 1 0 5.6M18 14.6c1.7.6 2.8 2.2 3 4.9"/>'),
  receipt: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
  card: svg('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'),
  store: svg('<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5M10 20v-4.5h4V20"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  bulb: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z"/>'),
  fork: svg('<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2 1-3 3.2-3 6v4h3"/>'),
  map: svg('<path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2Z"/><path d="M9 4v14M15 6v14"/>'),
  target: svg('<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  mail: svg('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  sparkle: svg('<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.9L12 18.5l-1.8-5.8-5.7-1.9L10.2 9Z"/>'),
};

// gpt-image로 그린 MOA·밥친구 그림 (assets/moa)
export const ART = {
  hero: 'assets/moa/hero.webp',
  delivery: 'assets/moa/delivery.webp',
  pickup: 'assets/moa/pickup.webp',
  taxi: 'assets/moa/taxi.webp',
  match: 'assets/moa/match.webp',
  inbox: 'assets/moa/inbox.webp',
  chatEmpty: 'assets/moa/chat-empty.webp',
};
// 동물 아바타 8종 — 예전 이모지 얼굴(🐻🦊🐰🐱🐶🐼🐧🐯)과 같은 순서
export const FACE_EMOJI = ['🐻', '🦊', '🐰', '🐱', '🐶', '🐼', '🐧', '🐯'];
export const avatar = k => `assets/moa/av${((k % 8) + 8) % 8}.webp`;
export const avatarOfEmoji = e => avatar(Math.max(0, FACE_EMOJI.indexOf(e)));
export const artImg = (key, cls = '') => `<img class="${cls}" src="${ART[key]}" alt="" aria-hidden="true" loading="lazy" decoding="async">`;
