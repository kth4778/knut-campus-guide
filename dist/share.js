// 공유하기: 갤럭시 「공유」처럼 아래에서 올라오는 창에 앱 아이콘을 늘어놓는다.
// 각 아이콘은 실제로 그 앱/서비스의 공유 주소를 연다.
// - 카카오톡: 카카오 앱 키 없이 웹에서 바로 보낼 방법이 없어서, 휴대폰이면 기기 공유 창(카카오톡이 들어 있음)을 열고
//   컴퓨터면 링크를 복사한 뒤 카카오톡에 붙여넣으라고 알려준다.
// - 메일·메시지는 기기의 메일·문자 앱을, X·페이스북·LINE은 각 서비스의 공유 페이지를 연다.

let toast = () => {};
export function initShare(tools) { toast = tools.toast; }

const TARGETS = [
  ['kakao', '카카오톡'], ['mail', '메일'], ['sms', '메시지'], ['copy', '링크 복사'],
  ['x', 'X'], ['facebook', '페이스북'], ['line', 'LINE'], ['more', '더보기'],
];

const enc = encodeURIComponent;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

function copy(url, message = '링크를 복사했어요.') {
  if (!navigator.clipboard) return toast('링크를 복사하지 못했어요.');
  navigator.clipboard.writeText(url).then(() => toast(message)).catch(() => toast('링크를 복사하지 못했어요.'));
}

function deviceShare(data, fallbackMessage) {
  if (navigator.share) return navigator.share(data).catch(() => {});
  copy(data.url, fallbackMessage);
}

// 메일·문자 앱 열기. 페이지 주소(location.href)를 바꾸지 않고 링크를 눌러 여는 방식이라 지금 화면이 그대로 남는다
function openApp(href) {
  const link = document.createElement('a');
  link.href = href;
  link.click();
}

function go(kind, {title, text, url}) {
  const message = `${title}\n${text ? text + '\n' : ''}${url}`;
  switch (kind) {
    case 'kakao': return deviceShare({title, text, url}, '링크를 복사했어요. 카카오톡 대화방에 붙여넣어 보내세요.');
    case 'mail': return openApp(`mailto:?subject=${enc(title)}&body=${enc(message)}`);
    case 'sms': return openApp(`sms:${/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?'}body=${enc(message)}`);
    case 'copy': return copy(url);
    case 'x': return window.open(`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`, '_blank', 'noopener');
    case 'facebook': return window.open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, '_blank', 'noopener');
    case 'line': return window.open(`https://social-plugins.line.me/lineit/share?url=${enc(url)}`, '_blank', 'noopener');
    case 'more': return deviceShare({title, text, url}, '이 기기는 공유 창을 지원하지 않아서 링크를 복사했어요.');
  }
}

export function openShare(host, data) {
  host.querySelector('dialog.share-sheet')?.close();
  const dialog = document.createElement('dialog');
  dialog.className = 'comment-sheet share-sheet';
  dialog.innerHTML = `<span class="share-grip" aria-hidden="true"></span>
    <h2>공유</h2>
    <div class="share-preview">
      <img src="assets/knutips-logo.webp" alt="" width="44" height="44">
      <span><strong>${esc(data.title)}</strong><small>${esc(data.url.replace(/^https?:\/\//, ''))}</small></span>
    </div>
    <div class="share-grid">${TARGETS.map(([kind, label]) => `<button type="button" data-share="${kind}">
      <img src="assets/share/${kind}.webp" alt="" width="52" height="52"><span>${label}</span></button>`).join('')}</div>
    <button type="button" class="share-cancel">닫기</button>`;
  host.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.closest('.share-cancel')) return dialog.close();
    const target = event.target.closest('[data-share]');
    if (!target) return;
    dialog.close();
    go(target.dataset.share, data);
  });
  dialog.showModal();
}
