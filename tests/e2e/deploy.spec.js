// A3·K. 배포 확인 — 배포된 공개 사이트(https://kth4778.github.io/knut-campus-guide/)를 연다.
// 배포가 끝난 뒤에 돌린다: npx playwright test --project=deploy
// 가짜 응답 없이 진짜 버스 키·진짜 네이버 지도를 쓴다.
const { test, expect } = require('./helpers');

const P0 = { tag: ['@P0', '@deploy'] };

test.describe('K. 배포 확인', () => {
  test.use({ naver: true });

  test('K1 공개 사이트가 열리고 콘솔 오류가 없다', P0, async ({ page }) => {
    const response = await page.goto('./');
    expect(response.status()).toBe(200);
    await expect(page.locator('#nav a')).toHaveCount(5);
    await expect(page.locator('.feed-post').first()).toBeVisible();
  });

  test('A3 배포본의 js·css 주소에 버전(?v=)이 붙어 있다', P0, async ({ page }) => {
    await page.goto('./');
    const files = await page.evaluate(() => [...document.querySelectorAll('script[src], link[rel="stylesheet"]')]
      .map(el => el.getAttribute('src') || el.getAttribute('href'))
      .filter(url => !/^(https?:|vendor\/)/.test(url) && !/config\.js/.test(url)));
    expect(files.length).toBeGreaterThan(5);
    expect(files.filter(url => !/\?v=[0-9a-f]{7}$/.test(url))).toEqual([]);
  });

  test('K2 config.js 에 버스 API 키가 들어 있다 (값은 출력하지 않음)', P0, async ({ request }) => {
    const text = await (await request.get('config.js?x=' + Date.now())).text();
    const key = /BUS_API_KEY:\s*'([^']*)'/.exec(text)?.[1] || '';
    expect(key.length, '버스 API 키 길이').toBeGreaterThan(20);
  });

  test('K3 공개 주소에서 네이버 지도가 인증을 통과한다', P0, async ({ page }) => {
    await page.goto('./#/map?focus=P089');
    await expect.poll(() => page.evaluate(() => !!window.naver?.maps), { timeout: 15000 }).toBe(true);
    await expect(page.locator('#map-canvas')).not.toHaveAttribute('style', /auth_fail/);
    await expect(page.locator('.leaflet-container')).toHaveCount(0);
    await expect(page.locator('.marker.selected')).toHaveCount(1);
  });

  test('E5 진짜 버스 API(TAGO)가 정상 응답한다 (키 만료 감지)', { tag: ['@P2', '@deploy'] }, async ({ request }) => {
    const text = await (await request.get('config.js?x=' + Date.now())).text();
    const key = /BUS_API_KEY:\s*'([^']*)'/.exec(text)?.[1] || '';
    test.skip(!key, '배포본에 키가 없음 (K2 에서 실패로 잡힘)');
    const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${key}&_type=json&numOfRows=3&pageNo=1&gpsLati=36.9652033&gpsLong=127.8714065`;
    const data = await (await request.get(url)).json();
    expect(data.response?.header?.resultCode).toBe('00');
  });
});
