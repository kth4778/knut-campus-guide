// 다이내믹 아일랜드 「지금 재생 중」 연출 (실제 소리는 나지 않는다)
// - 누르면 커지고, 다시 누르면 작아진다
// - 커진 상태에서 재생/일시정지 버튼을 누르면 소리 막대와 진행 막대가 멈춘다
const island = document.querySelector('.island-live');
if (island) {
  const bar = island.querySelector('.island-bar i');
  const time = island.querySelector('.island-time');
  const length = 167; // 곡 길이(초) 2:47
  let position = 38;
  let timer = null;

  const show = () => {
    bar.style.width = `${(position / length) * 100}%`;
    time.textContent = `${Math.floor(position / 60)}:${String(position % 60).padStart(2, '0')}`;
  };
  const play = () => {
    clearInterval(timer);
    timer = setInterval(() => { position = (position + 1) % length; show(); }, 1000);
  };

  island.addEventListener('click', event => {
    if (event.target.closest('.island-toggle')) {
      const paused = island.classList.toggle('paused');
      if (paused) clearInterval(timer); else play();
      return;
    }
    island.classList.toggle('open');
  });
  island.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); island.classList.toggle('open'); }
  });

  show();
  play();
}
