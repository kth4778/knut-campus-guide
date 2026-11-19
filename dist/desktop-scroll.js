// 컴퓨터(마우스)에서 가로로 넘기는 목록(카테고리 타일, 지도 칩, 버스 칩 등)을 넘길 수 있게 한다.
// - 마우스 휠을 위아래로 굴리면 가로로 넘어간다
// - 마우스로 잡고 좌우로 끌면 넘어간다 (끌었을 때는 손을 뗄 때 클릭이 눌리지 않게 막는다)
// 휴대폰 터치는 원래대로 손가락으로 넘기므로 건드리지 않는다. 지도 안에서는 지도 조작을 그대로 둔다.

function horizontalScroller(start) {
  for (let el = start; el && el !== document.body; el = el.parentElement) {
    if (el.closest?.('#map-canvas')) return null;
    if (el.scrollWidth <= el.clientWidth + 1) continue;
    const overflowX = getComputedStyle(el).overflowX;
    if (overflowX === 'auto' || overflowX === 'scroll') return el;
  }
  return null;
}

document.addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return; // 트랙패드 가로 밀기·확대는 그대로
  if (event.target.closest?.('.card-track')) return; // 카드뉴스 위에서 휠은 피드 세로 스크롤 (장 넘기기는 화살표·끌기)
  const scroller = horizontalScroller(event.target);
  if (!scroller) return;
  const max = scroller.scrollWidth - scroller.clientWidth;
  const atEdge = (event.deltaY < 0 && scroller.scrollLeft <= 0) || (event.deltaY > 0 && scroller.scrollLeft >= max - 1);
  if (atEdge) return; // 끝까지 갔으면 화면 전체 세로 스크롤로 넘긴다
  event.preventDefault();
  scroller.scrollLeft += event.deltaY;
}, {passive: false});

let drag = null;
let suppressClick = false;

document.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  const scroller = horizontalScroller(event.target);
  if (scroller) drag = {scroller, startX: event.clientX, startLeft: scroller.scrollLeft, moved: false};
});

document.addEventListener('pointermove', event => {
  if (!drag) return;
  const dx = event.clientX - drag.startX;
  if (!drag.moved && Math.abs(dx) < 6) return;
  drag.moved = true;
  drag.scroller.scrollLeft = drag.startLeft - dx;
  drag.scroller.style.cursor = 'grabbing';
  event.preventDefault();
});

document.addEventListener('pointerup', () => {
  if (!drag) return;
  suppressClick = drag.moved;
  drag.scroller.style.cursor = '';
  drag = null;
});

// 끌어서 넘긴 직후의 클릭은 버튼·링크가 눌리지 않게 막는다
document.addEventListener('click', event => {
  if (!suppressClick) return;
  suppressClick = false;
  event.preventDefault();
  event.stopPropagation();
}, true);

// 끄는 동안 링크·그림이 따라 끌려가지 않게
document.addEventListener('dragstart', event => {
  if (horizontalScroller(event.target)) event.preventDefault();
});
