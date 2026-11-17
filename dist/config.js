// 버스 실시간 정보 키. 공개 저장소라 여기에는 키를 넣어 커밋하지 마세요.
// - 배포(GitHub Pages): 저장소 Secret 'BUS_API_KEY'가 있으면 배포할 때 이 파일을 키가 든 파일로 바꿔 넣어요.
// - 내 컴퓨터: 키를 넣은 뒤 `git update-index --skip-worktree dist/config.js` 로 git이 이 파일 변경을 무시하게 해요.
// 키가 비어 있으면 정류장·터미널 위치와 지도 링크만 보여줘요.
window.KNUT_CONFIG = {
  BUS_API_KEY: '',
};
