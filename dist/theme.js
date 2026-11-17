// 화이트 모드: 홈 위쪽 해·달 버튼으로 다크 ↔ 화이트를 바꾸고, 이 브라우저(localStorage)에 기억해요.
// <head>에서 바로 실행돼서 화면이 그려지기 전에 색이 정해져요(깜빡임 없음).
(function () {
  const KEY = 'knut-campus-guide:theme';
  const META = {dark: '#0d1114', light: '#ffffff'};
  let theme = 'dark';
  try { theme = localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch {}

  const SUN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
  const MOON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/></svg>';

  function apply() {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme]);
    const btn = document.querySelector('.theme-btn');
    if (btn) paint(btn);
  }

  // 다크일 때는 해(→ 화이트로), 화이트일 때는 달(→ 다크로)
  function paint(btn) {
    btn.innerHTML = theme === 'light' ? MOON : SUN;
    btn.setAttribute('aria-label', theme === 'light' ? '다크 모드로 바꾸기' : '화이트 모드로 바꾸기');
  }

  function addButton() {
    const top = document.querySelector('.top.home-top') || document.querySelector('.top .middle.brand')?.closest('.top');
    if (!top || top.querySelector('.theme-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-btn';
    paint(btn);
    const right = top.lastElementChild;
    const lang = right.querySelector('.lang');
    lang ? lang.after(btn) : right.prepend(btn);
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.theme-btn')) return;
    theme = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(KEY, theme); } catch {}
    apply();
  });

  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    addButton();
    new MutationObserver(addButton).observe(document.getElementById('app') || document.body, {childList: true, subtree: true});
  });
})();
