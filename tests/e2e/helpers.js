// 모든 테스트가 같이 쓰는 준비물.
// - 시계를 2026-11-19 10:00(한국 시간)에서 시작 → 홈 피드 순서·MOA 남은 시간이 매번 같다
// - 버스 API(TAGO)·챗봇 AI(Ollama)는 진짜로 부르지 않고 fixtures/ 의 고정 응답을 준다
// - 네이버 지도는 기본으로 막아 Leaflet(대체 지도)으로 돌린다. 네이버를 시험할 때만 { naver: true }
// - 지도 배경 타일은 빈 그림으로 대신한다 (네트워크에 안 기대도록)
// - 콘솔 오류·페이지 오류를 모아 두고, 테스트가 끝날 때 하나라도 있으면 실패
const { test: base, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FIX = path.join(__dirname, 'fixtures');
const tago = name => fs.readFileSync(path.join(FIX, 'tago', name + '.json'), 'utf8');
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
// 다른 주소(공공데이터 API·Ollama)에서 온 응답처럼 보이게: 브라우저가 받아 주려면 이 헤더가 필요하다
const CORS = { 'Access-Control-Allow-Origin': '*' };
const NOW = new Date('2026-11-19T10:00:00+09:00');

const TAGO = [
  [/getCrdntPrxmtSttnList/, 'stations'],
  [/getSttnAcctoArvlPrearngeInfoList/, 'arrivals'],
  [/getRouteAcctoBusLcList/, 'bus-locations'],
  [/GetStrtpntAlocFndExpbusInfo/, 'express-timetable'],
  [/GetExpBusArrPrdtInfo/, 'express-running'],
];

const test = base.extend({
  naver: [false, { option: true }],
  busKey: [true, { option: true }],
  chatReply: ['학생식당은 **대학본부 복지관 1층**에 있어요.', { option: true }],
  errors: async ({}, use) => { await use([]); },

  page: async ({ page, naver, busKey, chatReply, errors }, use, testInfo) => {
    const deploy = testInfo.project.name === 'deploy';
    page.on('pageerror', error => errors.push('pageerror: ' + error.message));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const text = message.text();
      // 네이버 지도를 막았을 때 나는 로드 실패는 의도한 것
      if (!naver && /oapi\.map\.naver\.com|net::ERR_FAILED/.test(text + message.location().url)) return;
      // 네이버 지도 배경 그림 서버(map.naver.net)가 가끔 CORS 헤더 없이 답해 나는 오류는 우리가 고칠 수 없다.
      // 인증 실패는 D3·K3 이 지도 칸의 auth_fail 표시로 따로 잡는다
      if (naver && /map\.naver\.net|pstatic\.net|net::ERR_FAILED/.test(text + message.location().url)) return;
      errors.push('console: ' + text);
    });

    if (!deploy) {
      // 시계를 그 시각에서 시작해 실제처럼 흐르게 한다 (멈춰 두면 버스 API 요청 간격 계산이 영원히 기다린다)
      await page.clock.install({ time: NOW });
      await page.clock.resume();
      await page.route(/\/config\.js(\?|$)/, route => route.fulfill({
        contentType: 'text/javascript',
        body: `window.KNUT_CONFIG = { BUS_API_KEY: '${busKey ? 'TEST-KEY' : ''}' };`,
      }));
      // 혼밥 매칭은 실제 Firebase 에 붙지 않고 데모로 (가짜 Firebase 는 H5 가 따로 붙인다)
      await page.route(/firebase-config\.js/, route => route.fulfill({ contentType: 'text/javascript', body: 'window.KNUT_FIREBASE = null;' }));
      await page.route(/apis\.data\.go\.kr/, route => {
        const hit = TAGO.find(([pattern]) => pattern.test(route.request().url()));
        return hit ? route.fulfill({ contentType: 'application/json', headers: CORS, body: tago(hit[1]) }) : route.abort();
      });
      await page.route(/localhost:11434\/api\/chat/, route => route.fulfill({
        contentType: 'application/x-ndjson',
        headers: CORS,
        body: chatReply == null ? '' : JSON.stringify({ message: { content: chatReply }, done: false }) + '\n' + JSON.stringify({ done: true }) + '\n',
        status: chatReply == null ? 500 : 200,
      }));
      if (!naver) await page.route(/oapi\.map\.naver\.com/, route => route.abort());
      await page.route(/tile\.openstreetmap\.org/, route => route.fulfill({ contentType: 'image/png', body: BLANK_PNG }));
    }

    await use(page);

    expect(errors, '콘솔·페이지 오류가 없어야 해요').toEqual([]);
  },
});

// 앱을 열고 장소 데이터가 다 그려질 때까지 기다린다
async function openApp(page, hash = '#/') {
  await page.goto('/' + hash);
  await expect(page.locator('#nav a')).toHaveCount(5);
}

module.exports = { test, expect, openApp, NOW };
