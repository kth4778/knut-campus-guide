// 아래에서 올라오는 창(공유·댓글·버스·MOA)을 컴퓨터의 폰 틀 안에서 진짜 폰처럼 띄운다.
//
// dialog.showModal() 은 창을 브라우저 맨 위 층(top layer)으로 꺼내서 폰 화면 밖으로 삐져나온다.
// 폰 틀이 보일 때(넓은 화면)만 showModal 을 「폰 화면 안에서 여는 것」으로 바꿔 끼운다:
//   - 창은 .screen 안에 자리 잡아 화면의 둥근 모서리에 맞춰 잘리고
//   - 어두운 배경도 폰 화면에만 깔리고
//   - Esc·배경 누르기·손잡이 끌어내리기로 닫힌다
// 휴대폰(틀 없음)에서는 원래 showModal 을 그대로 쓴다.
(function () {
  const frame = matchMedia('(min-width: 521px)');
  const nativeShowModal = HTMLDialogElement.prototype.showModal;

  HTMLDialogElement.prototype.showModal = function () {
    const screen = this.closest('.screen');
    if (!frame.matches || !screen) return nativeShowModal.call(this);
    const dialog = this;
    const backdrop = document.createElement('div');
    backdrop.className = 'screen-backdrop';
    dialog.before(backdrop);
    dialog.classList.add('in-screen');
    dialog.show();
    requestAnimationFrame(() => backdrop.classList.add('on'));

    // 배경을 누르면 원래 showModal 의 ::backdrop 을 누른 것처럼 창 자신에게 click 을 보낸다
    // (각 창 코드가 「event.target === dialog 이면 닫기」로 처리한다)
    backdrop.addEventListener('click', () => dialog.dispatchEvent(new MouseEvent('click', {bubbles:true})));
    const onKey = event => { if (event.key === 'Escape' && dialog.open) { event.preventDefault(); dialog.close(); } };
    document.addEventListener('keydown', onKey);
    dialog.addEventListener('close', () => { backdrop.remove(); document.removeEventListener('keydown', onKey); }, {once:true});

    // 창 위쪽(손잡이·제목줄)을 아래로 끌어내리면 닫힌다
    let start = null;
    dialog.addEventListener('pointerdown', event => {
      const head = event.target.closest('.share-grip, .sheet-top, .share-sheet > h2');
      if (!head || event.target.closest('button, a, input')) return;
      start = {y:event.clientY, id:event.pointerId};
      dialog.setPointerCapture(event.pointerId);
      dialog.style.transition = 'none';
    });
    dialog.addEventListener('pointermove', event => {
      if (!start || event.pointerId !== start.id) return;
      dialog.style.transform = `translateY(${Math.max(0, event.clientY - start.y)}px)`;
    });
    const end = event => {
      if (!start || event.pointerId !== start.id) return;
      const moved = event.clientY - start.y;
      start = null;
      dialog.style.transition = '';
      dialog.style.transform = '';
      if (moved > 90) dialog.close();
    };
    dialog.addEventListener('pointerup', end);
    dialog.addEventListener('pointercancel', end);
  };
})();
