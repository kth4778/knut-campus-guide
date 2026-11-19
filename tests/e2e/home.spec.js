// A. 앱 시작·공통 / B. 홈·계정 / C. 게시물 동작  — docs/E2E_TEST_PLAN.md
const { test, expect, openApp } = require('./helpers');

const P0 = { tag: '@P0' };
const P1 = { tag: '@P1' };

test.describe('A. 앱 시작·공통', () => {
  test('A1 첫 화면: 장소 데이터 484개를 받고 홈 피드가 그려진다', P0, async ({ page }) => {
    const data = page.waitForResponse(r => r.url().includes('/data/places.json'));
    await openApp(page);
    expect((await (await data).json()).length).toBe(484);
    await expect(page.locator('.feed-post').first()).toBeVisible();
    expect(await page.locator('.feed-post').count()).toBeGreaterThan(10);
  });

  test('A4 탭 바 유리 렌즈를 마우스로 끌어 다른 탭에 놓으면 그 화면으로 간다', { tag: '@P1' }, async ({ page }) => {
    await openApp(page, '#/');
    const lens = page.locator('#nav .nav-lens');
    await expect(lens).toBeAttached();
    const from = await page.locator('#nav a', { hasText: '홈' }).boundingBox();
    const to = await page.locator('#nav a', { hasText: '검색' }).boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
    await expect(lens).toHaveClass(/dragging/);                       // 끄는 동안 커진다
    await page.mouse.up();
    await expect(page).toHaveURL(/#\/search$/);
    await expect(lens).not.toHaveClass(/dragging/);
    await expect(page.locator('#nav a[aria-current="page"]')).toHaveText('검색');
  });

  test('A2 하단 탭 5개: 주소가 바뀌고 고른 탭 아이콘이 채워진다', P0, async ({ page }) => {
    await openApp(page);
    const tabs = [['#/moa', 'MOA'], ['#/map', '지도'], ['#/search', '검색'], ['#/my', '프로필'], ['#/', '홈']];
    for (const [hash, label] of tabs) {
      await page.locator('#nav a', { hasText: label }).click();
      await expect(page).toHaveURL(new RegExp(hash.replace(/[/#]/g, '\\$&') + '$'));
      const current = page.locator('#nav a[aria-current="page"]');
      await expect(current).toHaveText(label);
      await expect(current.locator('svg')).toHaveAttribute('fill', 'currentColor');
    }
  });
  test('A5 게시물 「더 보기」는 다른 화면으로 가지 않고 그 자리에서 글을 펼친다', { tag: '@P1' }, async ({ page }) => {
    await openApp(page, '#/');
    // 「더 보기」가 있는 첫 게시물을 번호로 잡아 둔다 (누르면 버튼이 사라져서)
    const index = await page.locator('.feed-post').evaluateAll(posts => posts.findIndex(p => p.querySelector('.caption-more')));
    expect(index).toBeGreaterThanOrEqual(0);
    const post = page.locator('.feed-post').nth(index);
    const text = post.locator('.caption-text');
    const before = await text.evaluate(el => el.offsetHeight);
    await post.locator('.caption-more').click();
    await expect(page).toHaveURL(/#\/$/);
    await expect(text).toHaveClass(/open/);
    await expect(post.locator('.caption-more')).toHaveCount(0);
    expect(await text.evaluate(el => el.offsetHeight)).toBeGreaterThan(before);
  });
});

test.describe('B. 홈·계정', () => {
  test('B1 계정 동그라미: 맨 앞 새 글 + 계정 15개, 교통대 제휴를 누르면 계정 화면', P0, async ({ page }) => {
    await openApp(page);
    const stories = page.locator('.stories .story');
    await expect(stories).toHaveCount(16);
    await expect(stories.first()).toHaveClass(/story-new/);
    await page.locator('.story', { hasText: '교통대 제휴' }).click();
    await expect(page).toHaveURL(/#\/account\?id=/);
    await expect(page.locator('.acct-profile h1')).toHaveText('교통대 제휴');
  });

  test('B2 제휴 계정의 「식당」 칩: 17칸, 한 칸 누르면 제휴 게시물', P0, async ({ page }) => {
    await openApp(page, '#/account?id=제휴');
    await page.locator('.acct-chips .chip', { hasText: '식당' }).click();
    await expect(page.locator('.partner-tile')).toHaveCount(17);
    const name = (await page.locator('.partner-tile strong').first().textContent()).trim();
    await page.locator('.partner-tile').first().click();
    await expect(page).toHaveURL(/#\/partner\?id=S\d+/);
    // 카드뉴스가 있으면 카드뉴스, 없으면 혜택 상자 — 어느 쪽이든 그 매장 게시물이어야 한다
    await expect(page.locator('.post-owner small, .partner-card h3, .post-cover img').first()).toBeVisible();
    await expect(page.locator('.post-cover')).toHaveAttribute('aria-label', new RegExp(name));
  });

  test('B3 꿀팁 계정: 게시물 수 = 격자 칸 수, 칸을 누르면 상세', P1, async ({ page }) => {
    await openApp(page, '#/account?id=' + encodeURIComponent('학사·장학 팁'));
    const count = Number(await page.locator('.profile-counts b').first().textContent());
    await expect(page.locator('.post-grid > a')).toHaveCount(count);
    await page.locator('.post-grid > a').first().click();
    await expect(page).toHaveURL(/#\/place\?id=/);
    await expect(page.locator('.detail-title h1')).toBeVisible();
  });

  test('B4 한 번 본 계정은 홈에서 고리가 회색(seen)', P1, async ({ page }) => {
    await openApp(page);
    const story = page.locator('.story', { hasText: '식사' }).first();
    await expect(story).not.toHaveClass(/seen/);
    await story.click();
    await page.locator('#nav a', { hasText: '홈' }).click();
    await expect(page.locator('.story', { hasText: '식사' }).first()).toHaveClass(/seen/);
  });

  test('B5 홈 피드에 장소 사이로 제휴·꿀팁 게시물이 섞인다', P1, async ({ page }) => {
    await openApp(page);
    const owners = await page.locator('.feed-post .post-owner strong').allTextContents();
    expect(owners).toContain('교통대 제휴');
    expect(owners.filter(o => o === '교통대 제휴').length).toBeLessThan(owners.length / 2);
  });

  test('B6 「게시물 더 보기」: 게시물이 늘고 스크롤 위치는 그대로', P1, async ({ page }) => {
    await openApp(page);
    const before = await page.locator('.feed-post').count();
    const more = page.getByRole('button', { name: '게시물 더 보기' });
    await more.scrollIntoViewIfNeeded();
    const scroll = await page.locator('main.scroll').evaluate(el => el.scrollTop);
    await more.click();
    await expect.poll(() => page.locator('.feed-post').count()).toBeGreaterThan(before);
    expect(await page.locator('main.scroll').evaluate(el => el.scrollTop)).toBeCloseTo(scroll, -1);
  });
});

test.describe('C. 게시물 동작', () => {
  // 홈 피드에서 장소 게시물(공유 버튼이 있는 것) 하나를 고른다
  const placePost = page => page.locator('.feed-post', { has: page.locator('[data-action="copy"]') }).first();

  test('C1 좋아요: 빨간 채운 하트, 추천 수 +1, 새로고침해도 유지', P0, async ({ page }) => {
    await openApp(page);
    const post = placePost(page);
    const likes = post.locator('.post-likes');
    const before = Number((await likes.textContent()).match(/\d+/)[0]);
    await post.locator('[data-action="like"]').click();
    await expect(post.locator('[data-action="like"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(post.locator('[data-action="like"] svg')).toHaveAttribute('fill', 'currentColor');
    await expect(likes).toHaveText(`추천 ${before + 1}개`);
    await page.reload();
    await expect(placePost(page).locator('[data-action="like"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('C2 사진 두 번 누르기: 좋아요 + 하트 효과, 다시 두 번 눌러도 취소 안 됨, 한 번은 아무 일 없음', P0, async ({ page }) => {
    await openApp(page);
    const post = placePost(page);
    const cover = post.locator('[data-like-area]');
    await cover.click();
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(/#\/$/);
    await expect(post.locator('[data-action="like"]')).toHaveAttribute('aria-pressed', 'false');
    await cover.dblclick();
    await expect(post.locator('[data-action="like"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(cover.locator('.like-burst')).toHaveClass(/on/);
    await page.waitForTimeout(400);
    await cover.dblclick();
    await expect(post.locator('[data-action="like"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('C3 댓글: 폰 화면 안에 창이 열리고, 달면 「댓글 1개 모두 보기」', P1, async ({ page }) => {
    await openApp(page);
    const post = placePost(page);
    await post.locator('.post-actions [data-action="comments"]').click();
    const sheet = page.locator('dialog.comment-sheet');
    await expect(sheet).toHaveClass(/in-screen/);
    await sheet.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
    const [s, d] = await Promise.all([page.locator('.screen').boundingBox(), sheet.boundingBox()]);
    expect(Math.round(d.x)).toBe(Math.round(s.x));
    expect(Math.round(d.x + d.width)).toBe(Math.round(s.x + s.width));
    await sheet.locator('input[name="text"]').fill('테스트 댓글이에요');
    await sheet.locator('button[type="submit"]').click();
    await expect(page.locator('dialog.comment-sheet .comment-list')).toContainText('테스트 댓글이에요');
    await page.keyboard.press('Escape');
    await expect(placePost(page).locator('.post-caption button[data-action="comments"]')).toHaveText('댓글 1개 모두 보기');
  });

  test('C4 저장하면 프로필 저장 탭 격자에 나온다', P1, async ({ page }) => {
    await openApp(page);
    const post = placePost(page);
    const name = (await post.locator('.post-owner strong').textContent()).trim();
    await post.locator('.post-actions [data-action="save"]').click();
    await openApp(page, '#/my?tab=saved');
    await expect(page.locator('.post-grid > a')).toHaveCount(1);
    await expect(page.locator('.post-grid > a').first()).toHaveAttribute('aria-label', new RegExp(name.replace(/[()]/g, '\\$&')));
  });

  test('C5 공유 창: 폰 화면 안에 아이콘 8개, 링크 복사는 그 게시물 주소', P0, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openApp(page);
    const post = placePost(page);
    const href = await post.locator('.post-owner').getAttribute('href');
    await post.locator('[data-action="copy"]').click();
    const sheet = page.locator('dialog.share-sheet');
    await expect(sheet).toHaveClass(/in-screen/);
    await expect(sheet.locator('[data-share]')).toHaveCount(8);
    await sheet.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
    const [s, d] = await Promise.all([page.locator('.screen').boundingBox(), sheet.boundingBox()]);
    expect(d.y + d.height).toBeLessThanOrEqual(s.y + s.height + 1);
    await sheet.locator('[data-share="copy"]').click();
    await expect(page.locator('#toast')).toHaveText('링크를 복사했어요.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('http://localhost:5178/' + href);
  });

  test('C6 공유: 메일·메시지·X·페이스북·LINE 이 각자의 주소로 게시물 주소를 보낸다', P1, async ({ page }) => {
    await page.addInitScript(() => {
      window.__opened = [];
      window.open = url => { window.__opened.push(String(url)); return null; };
      // 메일·문자 앱을 여는 링크 클릭은 열지 않고 주소만 기록
      const click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (/^(mailto|sms):/.test(this.href)) window.__opened.push(this.href); else click.call(this); };
    });
    await openApp(page);
    const post = placePost(page);
    const href = await post.locator('.post-owner').getAttribute('href');
    const url = encodeURIComponent('http://localhost:5178/' + href);
    for (const kind of ['mail', 'sms', 'x', 'facebook', 'line']) {
      await post.locator('[data-action="copy"]').click();
      await page.locator(`dialog.share-sheet [data-share="${kind}"]`).click();
    }
    const opened = await page.evaluate(() => window.__opened);
    expect(opened).toHaveLength(5);
    expect(opened[0]).toMatch(/^mailto:\?subject=.+&body=/);
    expect(opened[1]).toMatch(/^sms:[?&]body=/);
    expect(opened[2]).toContain('https://twitter.com/intent/tweet?');
    expect(opened[3]).toContain('https://www.facebook.com/sharer/sharer.php?u=' + url);
    expect(opened[4]).toContain('https://social-plugins.line.me/lineit/share?url=' + url);
    for (const link of opened) expect(link).toContain(link.startsWith('mailto') || link.startsWith('sms') ? encodeURIComponent(href) : url);
  });

  test('C7 공유: 카카오톡·더보기는 기기 공유 창을, 없으면 링크 복사 + 안내', P1, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => { window.__shared = []; navigator.share = data => { window.__shared.push(data); return Promise.resolve(); }; });
    await openApp(page);
    const post = placePost(page);
    for (const kind of ['kakao', 'more']) {
      await post.locator('[data-action="copy"]').click();
      await page.locator(`dialog.share-sheet [data-share="${kind}"]`).click();
    }
    const shared = await page.evaluate(() => window.__shared);
    expect(shared).toHaveLength(2);
    expect(shared[0].url).toContain('#/place?id=');

    // 기기 공유 창이 없는 브라우저(컴퓨터)
    await page.evaluate(() => { delete Navigator.prototype.share; navigator.share = undefined; });
    await post.locator('[data-action="copy"]').click();
    await page.locator('dialog.share-sheet [data-share="kakao"]').click();
    await expect(page.locator('#toast')).toContainText('카카오톡 대화방에 붙여넣어');
  });
});
