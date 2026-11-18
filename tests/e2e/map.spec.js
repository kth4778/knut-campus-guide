// D. 검색·지도 / E. 버스·고속버스  — docs/E2E_TEST_PLAN.md
// 지도는 기본으로 Leaflet(대체 지도)으로 돌린다. D3 만 진짜 네이버 지도를 띄운다.
const { test, expect, openApp } = require('./helpers');

const P0 = { tag: '@P0' };
const P1 = { tag: '@P1' };

async function searchAndOpen(page, text) {
  await openApp(page, '#/search');
  await page.locator('#place-search').fill(text);
  await page.locator('#search-results .place-main', { hasText: text }).first().click();
}

test.describe('D. 검색·지도', () => {
  test('D1 「학생식당」 검색 → 지도로 가서 그 핀만 강조', P0, async ({ page }) => {
    await searchAndOpen(page, '학생식당');
    await expect(page).toHaveURL(/#\/map\?focus=P089$/);
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.marker.selected')).toHaveCount(1);
    await expect(page.locator('#map-result')).toContainText('학생식당');
  });

  test('D2 좌표 없는 항목(999번 버스)은 지도가 아니라 상세로 열린다', P0, async ({ page }) => {
    await searchAndOpen(page, '999번 버스');
    await expect(page).toHaveURL(/#\/place\?id=P178$/);
    await expect(page.locator('.detail-title h1')).toHaveText('999번 버스');
  });

  test.describe('네이버 지도', () => {
    test.use({ naver: true });
    test('D3 네이버 지도가 인증을 통과하고 핀이 뜬다', P0, async ({ page }) => {
      await openApp(page, '#/map?focus=P089');
      await expect.poll(() => page.evaluate(() => !!window.naver?.maps)).toBe(true);
      await expect(page.locator('.leaflet-container')).toHaveCount(0);
      await expect(page.locator('#map-canvas')).not.toHaveAttribute('style', /auth_fail/);
      await expect(page.locator('.marker.selected')).toHaveCount(1);
      await expect.poll(() => page.locator('.bmark').count()).toBeGreaterThan(20);  // 처음엔 고른 장소 + 학교 건물만
    });
  });

  test('D4 네이버 지도를 못 불러오면 Leaflet 으로 바뀌고 핀 강조는 그대로', P0, async ({ page }) => {
    await openApp(page, '#/map?focus=P089');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.marker.selected')).toHaveCount(1);
    await expect.poll(() => page.locator('.bmark').count()).toBeGreaterThan(20);
  });

  test('D5 지도를 끌고 확대한 뒤에도 하단 탭·칩·헤더가 눌린다', P0, async ({ page }) => {
    await openApp(page, '#/map');
    const canvas = page.locator('#map-canvas');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 160, { steps: 8 });
    await page.mouse.up();
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(500);
    // 각 버튼 한가운데를 실제로 누르면 그 버튼이 맞는지 (지도 조각이 가로채면 안 됨)
    // 화면에 보이는 것만 (칩 줄에서 옆으로 밀려 가려진 칩은 원래 못 누른다)
    const blocked = await page.evaluate(() => [...document.querySelectorAll('#nav a, .map-chips button, .top a')].filter(el => {
      const r = el.getBoundingClientRect();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      const box = (el.closest('.map-chips') || document.querySelector('.screen')).getBoundingClientRect();
      if (!r.width || x < box.left || x > box.right) return false;
      const hit = document.elementFromPoint(x, y);
      return !(el === hit || el.contains(hit));
    }).map(el => el.textContent.trim() || el.getAttribute('aria-label')));
    expect(blocked).toEqual([]);
    await page.locator('#nav a', { hasText: '검색' }).click();
    await expect(page).toHaveURL(/#\/search$/);
  });

  test('D6 「맛집」 칩: 맛집 핀만 남는다', P1, async ({ page }) => {
    await openApp(page, '#/map');
    await expect(page.locator('.bmark').first()).toBeVisible();
    await page.locator('.map-chips [data-category="맛집"]').click();
    await expect(page).toHaveURL(/category=/);
    await expect(page.locator('.bmark')).toHaveCount(0);                           // 칩을 고르면 건물 이름표는 빠진다
    await expect(page.locator('.marker[data-cat]').first()).toBeAttached();
    const cats = await page.locator('.marker[data-cat]').evaluateAll(els => [...new Set(els.map(e => e.dataset.cat))]);
    expect(cats).toEqual(['맛집']);
  });

  test('D7 같은 자리 묶음 핀(확대했을 때): 장소 목록이 뜨고 하나를 누르면 그 장소로', P1, async ({ page }) => {
    // 18단계 이상에서만 장소 핀이 하나하나 펼쳐진다 → 장소 하나를 골라 확대된 지도로 연다
    await openApp(page, '#/map?category=' + encodeURIComponent('생활꿀팁') + '&focus=P245');
    // 다른 핀(고속버스 정류소 등)에 덮이지 않은 묶음 핀을 고른다
    await expect(page.locator('.marker:has(.marker-count)').first()).toBeVisible();
    const index = await page.locator('.marker:has(.marker-count)').evaluateAll(els => els.findIndex(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }));
    expect(index).toBeGreaterThanOrEqual(0);
    await page.locator('.marker:has(.marker-count)').nth(index).click();
    const links = page.locator('.map-popup a');
    await expect(links.first()).toBeVisible();
    expect(await links.count()).toBeGreaterThan(1);
    const name = (await links.nth(1).textContent()).trim();
    await links.nth(1).click();
    await expect(page).toHaveURL(/#\/map\?focus=/);
    await expect(page.locator('#map-result')).toContainText(name);
  });

  test('D9 「전체」에는 버스·고속버스 핀이 없고, 「버스」를 고르면 정류장이 다 나온다', P1, async ({ page }) => {
    await openApp(page, '#/map');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.bmark').first()).toBeVisible();
    await expect(page.locator('.marker.transit-marker')).toHaveCount(0);
    await page.locator('.map-chips [data-category="버스"]').click();
    await expect(page.locator('.marker.transit-marker.bus')).toHaveCount(20);
  });

  test('D10 멀리서 보면 핀이 묶여 있고, 묶음을 누르면 확대되어 건물 핀이 나온다', P0, async ({ page }) => {
    await openApp(page, '#/map?category=' + encodeURIComponent('숨은장소'));
    await expect(page.locator('.cluster-pin').first()).toBeVisible();
    // 숨은장소 82곳이 핀 몇십 개로 정리된다
    expect(await page.locator('.marker').count()).toBeLessThan(100);
    const before = await page.locator('.building-pin').count();
    const biggest = await page.locator('.cluster-pin').evaluateAll(els => els.map(el => Number(el.textContent)).reduce((m, n, i, all) => n > all[m] ? i : m, 0));
    await page.locator('.cluster-pin').nth(biggest).click();
    await expect.poll(() => page.locator('.building-pin').count()).toBeGreaterThan(before);
    await expect(page.locator('.building-pin .building-name').first()).toBeVisible();
  });

  test('D11 건물 핀을 누르면 건물 화면: 3D 층 + 층을 누르면 그 층 장소 목록', P0, async ({ page }) => {
    // 교내 장소(중앙도서관 3층 열람실)로 확대된 지도를 열고, 축소 버튼 한 번(18→17단계)이면 건물 핀이 나온다
    await openApp(page, '#/map?category=' + encodeURIComponent('숨은장소') + '&focus=P150');
    await expect(page.locator('.marker.selected')).toHaveCount(1);
    await expect(page.locator('.building-pin')).toHaveCount(0);   // 18단계까지 확대가 끝났다
    await page.locator('.leaflet-control-zoom-out').click();
    await expect(page.locator('.building-pin').first()).toBeAttached();
    await page.waitForTimeout(400); // 축소 움직임이 끝나기를 기다린다
    // 지도 칸 안에 보이고 다른 것에 가리지 않은 건물 핀을 고른다
    const visible = await page.locator('.building-pin').evaluateAll(els => {
      const box = document.getElementById('map-canvas').getBoundingClientRect();
      return els.findIndex(el => {
        const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
        return x > box.left && x < box.right && y > box.top && y < box.bottom && el.contains(document.elementFromPoint(x, y));
      });
    });
    expect(visible).toBeGreaterThanOrEqual(0);
    await page.locator('.building-pin').nth(visible).click();
    await expect(page).toHaveURL(/#\/building\?name=/);
    await expect(page.locator('#nav a[aria-current="page"]')).toHaveText('지도');

    await openApp(page, '#/building?name=' + encodeURIComponent('중앙도서관'));
    await expect(page.locator('.building-head h1')).toContainText('중앙도서관');
    const slabs = page.locator('.floor-slab');
    await expect(slabs).toHaveCount(14);                                          // 1층~14층(OSM 층수)까지 빠짐없이
    await expect(slabs.first()).toHaveAttribute('aria-current', 'true');         // 처음엔 가장 아래층 (그림은 아래층부터 그린다)
    await expect(page.locator('.iso-building figcaption')).toContainText('OpenStreetMap');  // 실제 바닥 모양으로 그렸다
    await page.locator('.floor-slab[aria-label^="3층"]').click();
    await expect(page.locator('.floor-slab[aria-label^="3층"]')).toHaveClass(/on/);
    await expect(page.locator('.floor-places h2')).toContainText('3층');
    await expect(page.locator('.floor-places .place-row')).toHaveCount(3);
    await expect(page.locator('.floor-places')).toContainText('중앙도서관 3층 열람실');
    await page.locator('.floor-unknown').click();
    await expect(page.locator('.floor-places h2')).toContainText('층 정보 없음');
  });

  test('D13 건물 화면에 학교 공식 층별 안내가 아이콘 카드로 나온다', P1, async ({ page }) => {
    await openApp(page, '#/building?name=' + encodeURIComponent('대학본부') + '&floor=6');
    await expect(page.locator('.building-code')).toHaveText('E8');
    await expect(page.locator('.floor-slab')).toHaveCount(8);
    await expect(page.locator('.floor-places h2')).toContainText('6층');
    const cards = page.locator('.guide-card');
    await expect(cards).toHaveCount(5);
    await expect(cards.filter({ hasText: '교무과' }).locator('img')).toHaveAttribute('src', 'assets/floor/office.webp');
    await page.locator('.floor-step', { hasText: '7층' }).click();
    await expect(page.locator('.floor-places h2')).toContainText('7층');
    await expect(page.locator('.building-note')).toContainText('캠퍼스지도');
  });

  test('D14 지도 첫 화면은 학교 건물만(코드+이름), 칩을 고르면 빠지고, 건물을 누르면 실제 모양 3D 건물', P0, async ({ page }) => {
    await openApp(page, '#/map');
    await expect.poll(() => page.locator('.bmark').count()).toBeGreaterThan(30);   // 건물 34곳 (겹치면 코드만·점으로 줄어든다)
    await expect(page.locator('.marker[data-cat]')).toHaveCount(0);               // 장소 핀은 없다
    await expect(page.locator('.map-chips [data-category="전체"]')).toHaveText('건물');
    await expect(page.locator('#map-result')).toContainText('교내 건물');
    await expect(page.locator('.bmark.full').first()).toBeVisible();
    await page.locator('[data-action="map-category"][data-category="버스"]').click();
    await expect(page.locator('.bmark')).toHaveCount(0);

    await openApp(page, '#/map');
    await expect(page.locator('.bmark.full').first()).toBeVisible();
    // 지도 칸 안에 있고 다른 것에 가리지 않은 이름표 하나를 누른다
    const pick = await page.locator('.bmark.full').evaluateAll(els => {
      const box = document.getElementById('map-canvas').getBoundingClientRect();
      return els.findIndex(el => {
        const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
        return x > box.left && x < box.right && y > box.top && y < box.bottom && el.contains(document.elementFromPoint(x, y));
      });
    });
    expect(pick).toBeGreaterThanOrEqual(0);
    const tag = page.locator('.bmark.full').nth(pick);
    const code = (await tag.locator('b').textContent()).trim();
    await tag.click();
    await expect(page).toHaveURL(/#\/building\?name=/);
    await expect(page.locator('.building-code')).toHaveText(code);
    expect(await page.locator('.iso-building svg .plate').count()).toBeGreaterThan(0);

    await openApp(page, '#/building?name=' + encodeURIComponent('시스템관·국원문화관'));
    await expect(page.locator('.building-code')).toHaveText('E4');
    await expect(page.locator('.floor-slab')).toHaveCount(6);
    await expect(page.locator('.guide-card').first()).toContainText('국원문화관');  // 처음엔 안내가 있는 가장 아래층(1층)
  });

  test('D12 확대하면(18단계) 묶음이 풀리고 장소 핀이 하나하나 나온다', P1, async ({ page }) => {
    await openApp(page, '#/map?category=' + encodeURIComponent('맛집') + '&focus=P089');
    await expect(page.locator('.marker.selected')).toHaveCount(1);
    await expect(page.locator('.building-pin')).toHaveCount(0);
    await expect.poll(() => page.locator('.marker[data-cat="맛집"]').count()).toBeGreaterThan(50);
  });

  test('D8 컴퓨터에서 칩 줄을 휠·끌기로 넘기고, 끈 뒤에는 칩이 눌리지 않는다', P1, async ({ page }) => {
    await openApp(page, '#/map');
    const chips = page.locator('.map-chips');
    const max = await chips.evaluate(el => el.scrollWidth - el.clientWidth);
    test.skip(max < 5, '이 화면 너비에서는 칩 줄이 넘치지 않음');
    const box = await chips.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => chips.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await chips.evaluate(el => { el.scrollLeft = 0; });
    const url = page.url();
    await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    expect(await chips.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    expect(page.url()).toBe(url);
  });
});

test.describe('E. 버스·고속버스 (고정 응답)', () => {
  test('E1 「버스」 → 정류장 핀 → 도착 예정 목록', P1, async ({ page }) => {
    await openApp(page, '#/map?category=버스');
    await page.locator('.marker.transit-marker.bus').first().click();
    const sheet = page.locator('dialog.transit-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('.arrivals li')).toHaveCount(2);
    await expect(sheet.locator('.arrivals li').first()).toContainText('120번');
    await expect(sheet.locator('.arrivals li').first()).toContainText('곧 도착');
    await expect(sheet.locator('.arrivals li').nth(1)).toContainText('7분 후');
  });

  test.describe('키 없음', () => {
    test.use({ busKey: false });
    test('E2 키가 없으면 안내만 나오고 오류는 없다', P1, async ({ page }) => {
      await openApp(page, '#/map?category=버스');
      await page.locator('.marker.transit-marker.bus').first().click();
      await expect(page.locator('dialog.transit-sheet')).toContainText('버스 API 키를 넣으면');
      await expect(page.locator('#live-row')).toContainText('키가 필요해요');
    });
  });

  test('E3 실시간 노선: 고른 노선의 버스가 지도에 뜨고, 5번째는 막힌다', P1, async ({ page }) => {
    await openApp(page, '#/map?category=버스');
    const row = page.locator('#live-row');
    await expect(row).toContainText(/실시간 \d+대/);
    await expect(page.locator('.live-bus').first()).toBeVisible();
    // 이미 고른 것(기본 999) 포함 4개까지
    const off = row.locator('[data-action="live-route"][aria-pressed="false"]');
    for (let i = 0; i < 3; i++) await off.first().click();
    await expect(row.locator('[aria-pressed="true"]')).toHaveCount(4);
    await off.first().click();
    await expect(page.locator('#toast')).toContainText('4개까지');
    await expect(row.locator('[aria-pressed="true"]')).toHaveCount(4);
  });

  test('E4 고속버스 시간표: 시간·요금이 나오고 이미 떠난 차는 「운행 중」', P1, async ({ page }) => {
    await openApp(page, '#/map?category=고속버스');
    await page.locator('.marker.transit-marker.exp').first().click();
    const sheet = page.locator('dialog.transit-sheet');
    await expect(sheet.locator('.exp-row')).toHaveCount(4);
    await expect(sheet).toContainText('9,600원');
    await expect(sheet.locator('.exp-row').first()).toContainText('09:10');
    await expect(sheet.locator('.exp-row').first()).toContainText('운행 중');
  });
});
