// E2E 테스트 설정. 계획: docs/E2E_TEST_PLAN.md
// - desktop: 컴퓨터에서 보는 폰 틀 화면 (대부분의 테스트)
// - mobile : 휴대폰 화면 (@mobile 태그만)
// - deploy : 배포된 공개 사이트 확인 (@deploy 태그만, 배포 뒤에 돌린다)
const { defineConfig, devices } = require('@playwright/test');

// 내 컴퓨터에선 설치된 Chrome 을 쓰고, CI(GitHub Actions)에선 Playwright 가 받은 Chromium 을 쓴다
const channel = process.env.CI ? undefined : 'chrome';

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    // 네이버 지도는 등록된 주소 http://localhost:5178 에서만 뜬다
    baseURL: 'http://localhost:5178',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', grepInvert: /@mobile|@deploy/, use: { channel, viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', grep: /@mobile/, use: { ...devices['Pixel 7'], channel } },
    { name: 'deploy', grep: /@deploy/, use: { channel, baseURL: 'https://kth4778.github.io/knut-campus-guide/', viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'python3 -m http.server 5178 --bind 127.0.0.1 --directory dist',
    url: 'http://localhost:5178/',
    reuseExistingServer: true,
  },
});
