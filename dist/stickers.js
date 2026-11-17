// 누티(Nuti) 이모티콘: 챗봇과 모든 채팅방(MOA 참여자 채팅방)에서 같이 써요.
// 그림은 assets/nuti/<id>.webp (256×256)

export const STICKERS = [
  ['hello', '안녕!'], ['yay', '신나요!'], ['love', '사랑해요!'], ['curious', '궁금해요!'], ['sad', '힝ㅠㅠ'],
  ['sleepy', '졸려요...'], ['yum', '맛있어요!'], ['study', '공부 중!'], ['cafe', '카페가 좋아요!'], ['go', '가자!'],
  ['shy', '부끄러워요!'], ['levelup', '레벨업!'], ['together', '같이하자!'], ['goodjob', '오늘도 수고했어!'],
];
const LABEL = new Map(STICKERS);
export const stickerLabel = id => LABEL.get(id) ?? '';
export const isSticker = id => LABEL.has(id);
export const stickerSrc = id => `assets/nuti/${id}.webp`;
export const stickerImg = (id, cls = 'sticker') => isSticker(id)
  ? `<img class="${cls}" src="${stickerSrc(id)}" alt="누티 이모티콘: ${stickerLabel(id)}" width="120" height="120" loading="lazy">` : '';

// 입력창 옆 이모티콘 버튼 + 펼치는 이모티콘 판. 고르면 data-sticker 버튼이 눌려요.
export const stickerButton = () => `<button type="button" class="sticker-toggle" data-sticker-toggle aria-label="누티 이모티콘" aria-expanded="false"><img src="${stickerSrc('hello')}" alt="" width="28" height="28"></button>`;
export const stickerPanel = () => `<div class="sticker-panel" hidden>${STICKERS.map(([id, label]) =>
  `<button type="button" data-sticker="${id}" aria-label="${label}"><img src="${stickerSrc(id)}" alt="" width="64" height="64" loading="lazy"></button>`).join('')}</div>`;

// 판 열고 닫기 (페이지 어디서든 한 번만 연결)
document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-sticker-toggle]');
  if (toggle) {
    const panel = toggle.closest('form, .sticker-host')?.parentElement?.querySelector('.sticker-panel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    return;
  }
  const pick = event.target.closest('[data-sticker]');
  if (pick) {
    const panel = pick.closest('.sticker-panel');
    if (panel) panel.hidden = true;
    document.querySelectorAll('[data-sticker-toggle]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
});
