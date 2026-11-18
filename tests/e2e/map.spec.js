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
      expect(await page.locator('.marker').count()).toBeGreaterThan(50);
    });
  });

  test('D4 네이버 지도를 못 불러오면 Leaflet 으로 바뀌고 핀 강조는 그대로', P0, async ({ page }) => {
    await openApp(page, '#/map?focus=P089');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.marker.selected')).toHaveCount(1);
    expect(await page.locator('.marker').count()).toBeGreaterThan(50);
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
    const all = await page.locator('.marker').count();
    await page.locator('.map-chips [data-category="맛집"]').click();
    await expect(page).toHaveURL(/category=/);
    await expect.poll(() => page.locator('.marker').count()).toBeLessThan(all);
    const cats = await page.locator('.marker[data-cat]').evaluateAll(els => [...new Set(els.map(e => e.dataset.cat))]);
    expect(cats).toEqual(['맛집']);
  });

  test('D7 같은 건물 묶음 핀: 장소 목록이 뜨고 하나를 누르면 그 장소로', P1, async ({ page }) => {
    await openApp(page, '#/map');
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

  test('D9 버스·고속버스 핀이 같은 자리의 장소 핀을 덮지 않는다', P1, async ({ page }) => {
    await openApp(page, '#/map');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.marker.transit-marker').first()).toBeVisible();
    // 장소 핀 한가운데를 누르면 교통 핀이 아니라 그 장소 핀이 눌려야 한다
    const covered = await page.locator('.marker:not(.transit-marker)').evaluateAll(els => els.filter(el => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return hit?.closest('.transit-marker');
    }).map(el => el.closest('[title]')?.getAttribute('title')));
    expect(covered).toEqual([]);
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
