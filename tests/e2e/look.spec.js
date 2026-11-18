// I. 다국어·테마 / J. 폰 틀·아일랜드 / L. 접근성  — docs/E2E_TEST_PLAN.md
const { test, expect, openApp } = require('./helpers');
const { default: AxeBuilder } = require('@axe-core/playwright');

const P1 = { tag: '@P1' };
const P2 = { tag: '@P2' };

test.describe('I. 다국어·테마', () => {
  test('I1 English: 탭·버튼은 영어, 가게 이름은 한국어 그대로, 새로고침해도 유지', P1, async ({ page }) => {
    await openApp(page);
    const place = (await page.locator('.feed-post:not(.welcome-post) .post-owner strong').first().textContent()).trim();
    await page.locator('.lang-btn').click();
    await page.locator('[data-lang="en"]').click();
    await expect(page.locator('#nav a').first()).toHaveText('Home');
    await expect(page.locator('#nav a', { hasText: 'Search' })).toHaveCount(1);
    await expect(page.locator('.feed-post:not(.welcome-post) .post-owner strong').first()).toHaveText(place);
    await page.reload();
    await expect(page.locator('#nav a').first()).toHaveText('Home');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('I2 화이트 모드: 배경이 밝아지고 새로고침해도 유지', P1, async ({ page }) => {
    await openApp(page);
    const dark = await page.locator('.screen').evaluate(el => getComputedStyle(el).backgroundColor);
    await page.locator('.theme-btn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect.poll(() => page.locator('.screen').evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(dark);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.locator('.screen').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  });

  test('I3 4개 언어 × 주요 화면: 번역 안 된 한국어 버튼 목록', P2, async ({ page }, testInfo) => {
    const report = {};
    for (const lang of ['en', 'zh', 'ja']) {
      await page.addInitScript(l => localStorage.setItem('knut-campus-guide:lang', l), lang);
      for (const hash of ['#/', '#/map', '#/search', '#/my', '#/moa', '#/settings', '#/chat']) {
        await openApp(page, hash);
        await page.waitForTimeout(300);
        // 버튼·탭·제목처럼 「화면 글자」만 본다 (가게 이름·후기는 원래 한국어)
        const left = await page.locator('#nav a, .top, button:visible, .chip:visible, .profile-actions a, .settings h2, .setting-row strong')
          .evaluateAll(els => [...new Set(els.map(e => e.innerText.trim()).filter(t => /[가-힣]/.test(t) && t.length < 20))]);
        if (left.length) report[`${lang} ${hash}`] = left;
      }
    }
    await testInfo.attach('untranslated.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
    console.log('[I3] 번역 안 된 화면 글자:', JSON.stringify(report));
  });
});

test.describe('J. 폰 틀·아일랜드', () => {
  test.describe('낮은 창', () => {
    test.use({ viewport: { width: 1280, height: 680 } });
    test('J1 1280×680 에서도 폰 위쪽이 잘리지 않는다', P1, async ({ page }) => {
      await openApp(page);
      const box = await page.locator('.device').boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(680 + 1);
    });
  });

  test('J2 아일랜드: 누르면 커지고 재생 시간이 오르며, 일시정지하면 멈춘다', P1, async ({ page }) => {
    await openApp(page);
    const island = page.locator('.island-live');
    await island.click();
    await expect(island).toHaveClass(/open/);
    const time = island.locator('.island-time');
    const t0 = await time.textContent();
    await expect.poll(() => time.textContent(), { timeout: 4000 }).not.toBe(t0);
    await island.locator('.island-toggle').click();
    await expect(island).toHaveClass(/paused/);
    const t1 = await time.textContent();
    await page.waitForTimeout(1500);
    expect(await time.textContent()).toBe(t1);
  });

  test('J3 휴대폰 크기: 폰 틀·아일랜드가 숨고 화면을 다 쓰며 가로로 넘치지 않는다', { tag: ['@P1', '@mobile'] }, async ({ page }) => {
    await openApp(page);
    await expect(page.locator('.island-live')).toBeHidden();
    const vw = page.viewportSize().width;
    const box = await page.locator('.device').boundingBox();
    expect(Math.round(box.width)).toBe(vw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vw);
    await page.locator('#nav a', { hasText: '지도' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('J4 화면 사진 비교 (홈·지도·프로필)', P2, async ({ page }) => {
    test.skip(!!process.env.CI, '기준 사진은 내 컴퓨터(macOS)에서 만든 것이라 CI(리눅스)와 글꼴이 달라 비교하지 않음');
    for (const [name, hash] of [['home', '#/'], ['map', '#/map'], ['profile', '#/my']]) {
      await openApp(page, hash);
      await page.waitForTimeout(600);
      await expect(page.locator('.device')).toHaveScreenshot(`${name}.png`, {
        animations: 'disabled', mask: [page.locator('.island-live'), page.locator('.leaflet-tile-pane')], maxDiffPixelRatio: 0.02,
      });
    }
  });
});

test.describe('L. 접근성', () => {
  test('L1 주요 화면 자동 검사(axe): 심각한 문제 0', P2, async ({ page }, testInfo) => {
    const found = {};
    for (const hash of ['#/', '#/map', '#/search', '#/my', '#/moa']) {
      await openApp(page, hash);
      await page.waitForTimeout(400);
      const result = await new AxeBuilder({ page }).include('.screen').analyze();
      const bad = result.violations.filter(v => ['serious', 'critical'].includes(v.impact));
      if (bad.length) found[hash] = bad.map(v => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}곳)`);
    }
    await testInfo.attach('axe.json', { body: JSON.stringify(found, null, 2), contentType: 'application/json' });
    expect(found, '심각한 접근성 문제').toEqual({});
  });

  test('L2 키보드만으로 하단 탭 이동, 공유 창 열기·닫기', P2, async ({ page }) => {
    await openApp(page);
    await page.locator('#nav a', { hasText: '검색' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/search$/);
    await page.locator('#nav a', { hasText: '홈' }).focus();
    await page.keyboard.press('Enter');
    await page.locator('.feed-post [data-action="copy"]').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('dialog.share-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.share-sheet')).toHaveCount(0);
  });

  test('L3 「움직임 줄이기」 설정이면 아일랜드 막대가 움직이지 않는다', P2, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page);
    expect(await page.locator('.island-eq i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  });

  test('L4 글자 없는 버튼·링크에는 화면 낭독용 이름이 있다', P2, async ({ page }) => {
    const nameless = [];
    for (const hash of ['#/', '#/map', '#/search', '#/my', '#/moa', '#/settings']) {
      await openApp(page, hash);
      nameless.push(...await page.locator('.screen button:visible, .screen a:visible').evaluateAll((els, h) => els
        .filter(el => !el.innerText.trim() && !el.getAttribute('aria-label') && !el.getAttribute('title') && !el.querySelector('img[alt]:not([alt=""])'))
        .map(el => `${h} ${el.outerHTML.slice(0, 80)}`), hash));
    }
    expect(nameless).toEqual([]);
  });
});
