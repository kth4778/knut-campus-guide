// F. MOA / G. 프로필·설정·글쓰기 / H. 챗봇 누티  — docs/E2E_TEST_PLAN.md
const { test, expect, openApp } = require('./helpers');

const P0 = { tag: '@P0' };
const P1 = { tag: '@P1' };
const P2 = { tag: '@P2' };

const openCount = page => page.locator('.moa-hero p strong').textContent().then(Number);
const card = (page, title) => page.locator('.moa-card', { hasText: title });
const won = text => Number(text.replace(/[^\d]/g, ''));

test.describe('F. MOA', () => {
  test('F1 배달 모집 올리기: 목록에 생기고 「모집 중」 수 +1', P0, async ({ page }) => {
    await openApp(page, '#/moa');
    const before = await openCount(page);
    await page.locator('[data-moa="new"]').first().click();
    const form = page.locator('dialog.moa-sheet form');
    await form.locator('input[name="title"]').fill('E2E 치킨 같이 시켜요');
    await form.locator('input[name="money"]').fill('4000');
    await form.locator('input[name="nick"]').fill('테스터');
    await form.getByRole('button', { name: '올리기' }).click();
    await expect(page.locator('dialog.moa-sheet')).toHaveCount(0);
    await expect(card(page, 'E2E 치킨 같이 시켜요')).toBeVisible();
    await expect(card(page, 'E2E 치킨 같이 시켜요')).toContainText('내 모집');
    expect(await openCount(page)).toBe(before + 1);
  });

  test('F2 분류 칩·「내 참여」: 걸러진 개수가 칩 숫자와 같다', P1, async ({ page }) => {
    await openApp(page, '#/moa');
    for (const value of ['delivery', 'pickup', 'taxi']) {
      const chip = page.locator(`[data-moa="filter"][data-value="${value}"]`);
      const shown = Number((await chip.textContent()).match(/\d+/)[0]);
      await chip.click();
      await expect(page.locator('.moa-card')).toHaveCount(shown);
    }
    await page.locator('[data-moa="filter"][data-value="all"]').click();
    await page.locator('[data-moa="mine"]').click();
    await expect(page.locator('.moa-card')).toHaveCount(0);
    await expect(page.locator('.moa-list')).toContainText('참여한 모집이 없어요');
  });

  test('F3 참여하기: 참여자 +1, 채팅방 버튼이 생기고 들어갈 수 있다', P0, async ({ page }) => {
    await openApp(page, '#/moa');
    const target = card(page, '충주터미널 가실 분');
    const before = Number((await target.locator('.moa-bottom small').textContent()).match(/(\d+)\//)[1]);
    await target.locator('[data-moa="join"]').click();
    const sheet = page.locator('dialog.moa-sheet');
    await sheet.locator('input[name="nick"]').fill('테스터');
    await sheet.getByRole('button', { name: '참여하기' }).click();
    await expect(page.locator('#toast')).toContainText('참여했어요');
    await expect(target.locator('.moa-bottom small')).toContainText(`${before + 1}/`);
    await expect(target.locator('[data-moa="join"]')).toHaveText('참여 중 ✓');
    await target.locator('[data-moa="chat"]').click();
    await expect(page).toHaveURL(/#\/moa-chat\?id=s2/);
    await expect(page.locator('.room-page')).toBeVisible();
  });

  test('F4 채팅방: 메시지와 이모티콘을 보낼 수 있다', P1, async ({ page }) => {
    await openApp(page, '#/moa');
    await card(page, '충주터미널 가실 분').locator('[data-moa="join"]').click();
    await page.locator('dialog.moa-sheet input[name="nick"]').fill('테스터');
    await page.locator('dialog.moa-sheet').getByRole('button', { name: '참여하기' }).click();
    await openApp(page, '#/moa-chat?id=s2');
    await page.locator('#room-form input[name="text"]').fill('정문에서 10시에 봬요');
    await page.locator('#room-form input[name="text"]').press('Enter');
    await expect(page.locator('.room-msg.me').last()).toContainText('정문에서 10시에 봬요');
    await page.locator('#room-form [data-sticker-toggle]').click();
    await page.locator('.room-page .sticker-panel [data-sticker]').first().click();
    await expect(page.locator('.room-msg.me.sticker-msg')).toHaveCount(1);
  });

  test('F5 픽업 N빵: 내가 참여하면 1인 금액이 다시 계산되어 줄어든다', P1, async ({ page }) => {
    await openApp(page, '#/moa');
    const pickup = page.locator('.moa-card', { hasText: '🍕 픽업' }).first();
    const before = won(await pickup.locator('.moa-nums b').textContent());
    await pickup.locator('[data-moa="join"]').click();
    await page.locator('dialog.moa-sheet input[name="nick"]').fill('테스터');
    await page.locator('dialog.moa-sheet').getByRole('button', { name: '참여하기' }).click();
    await expect.poll(async () => won(await pickup.locator('.moa-nums b').textContent())).toBeLessThan(before);
  });

  test('F6 모집하기 창: 폰 화면 안에 맞고 창 안에서 스크롤된다', P1, async ({ page }) => {
    await openApp(page, '#/moa');
    await page.locator('[data-moa="new"]').first().click();
    const sheet = page.locator('dialog.moa-sheet');
    await expect(sheet).toHaveClass(/in-screen/);
    await sheet.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));  // 올라오는 움직임이 끝난 뒤에 잰다
    const [s, d] = await Promise.all([page.locator('.screen').boundingBox(), sheet.boundingBox()]);
    expect(Math.round(d.x)).toBe(Math.round(s.x));
    expect(Math.round(d.x + d.width)).toBe(Math.round(s.x + s.width));
    expect(Math.round(d.y + d.height)).toBe(Math.round(s.y + s.height));
    expect(await sheet.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  });
});

test.describe('G. 프로필·설정·글쓰기', () => {
  // 작은 PNG (2×2) 와 1MB 넘는 가짜 JPG
  const smallPng = { name: 'photo.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mP8z8Dwn4GBgYGJAQoAADKUAwFVb+JaAAAAAElFTkSuQmCC', 'base64') };
  const bigJpg = { name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1_000_000, 1) };

  test('G1 새 게시물(사진 포함): 프로필 격자 1칸, 홈 맨 위에도 보인다', P0, async ({ page }) => {
    await openApp(page, '#/compose');
    await page.locator('input[name="photo"]').setInputFiles(smallPng);
    await page.locator('input[name="name"]').fill('E2E 테스트 장소');
    await page.locator('textarea[name="caption"]').fill('테스트로 올린 글이에요');
    await page.getByRole('button', { name: '게시' }).click();
    await expect(page).toHaveURL(/#\/my$/);
    await expect(page.locator('.post-grid > a')).toHaveCount(1);
    await page.locator('#nav a', { hasText: '홈' }).click();
    // 맨 위 「KNUTIPS」 환영 카드 바로 다음
    await expect(page.locator('.feed-post:not(.welcome-post) .post-owner strong').first()).toHaveText('E2E 테스트 장소');
  });

  test('G2 950KB 넘는 사진은 오류 문구, 저장 안 됨', P1, async ({ page }) => {
    await openApp(page, '#/compose');
    await page.locator('input[name="photo"]').setInputFiles(bigJpg);
    await page.locator('input[name="name"]').fill('큰 사진');
    await page.locator('textarea[name="caption"]').fill('저장되면 안 돼요');
    await page.getByRole('button', { name: '게시' }).click();
    await expect(page.locator('.form-error')).toContainText('950KB');
    await expect(page).toHaveURL(/#\/compose$/);
    expect(await page.evaluate(() => localStorage.getItem('knut-campus-guide:posts'))).toBeNull();
  });

  test('G3 프로필 편집: 이름·소개가 바뀌고 새로고침해도 유지', P1, async ({ page }) => {
    await openApp(page, '#/my');
    await page.locator('.profile-actions a', { hasText: '프로필 편집' }).click();
    await page.locator('#profile-form input[name="name"]').fill('테스트 이름');
    await page.locator('#profile-form textarea[name="bio"]').fill('테스트 소개');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.locator('.profile-info h1')).toHaveText('테스트 이름');
    await page.reload();
    await expect(page.locator('.profile-info h1')).toHaveText('테스트 이름');
    await expect(page.locator('.profile > p')).toHaveText('테스트 소개');
  });

  test('G4 설정 → 내 기록 모두 지우기: 모든 기록이 처음 상태', P1, async ({ page }) => {
    await openApp(page);
    await page.locator('.feed-post [data-action="like"]').first().click();
    await page.locator('.feed-post [data-action="save"]').first().click();
    await openApp(page, '#/settings');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action="reset-data"]').click();
    await expect(page.locator('#toast')).toContainText('지웠어요');
    await expect(page.locator('[data-action="reset-data"] small')).toHaveText('게시물 0 · 좋아요 0 · 댓글 0 · 저장 0');
    const left = await page.evaluate(() => ['posts', 'likes', 'comments', 'saved', 'profile'].map(k => localStorage.getItem('knut-campus-guide:' + k)));
    expect(left).toEqual([null, null, null, null, null]);
  });

  test('G5 팔로워·팔로잉은 0', P2, async ({ page }) => {
    await openApp(page, '#/my');
    await expect(page.locator('.profile-counts span', { hasText: '팔로워' }).locator('b')).toHaveText('0');
    await expect(page.locator('.profile-counts span', { hasText: '팔로잉' }).locator('b')).toHaveText('0');
  });
});

test.describe('H. 챗봇 누티 (가짜 AI)', () => {
  test('H1 「학생식당 어디야」: 장소 데이터를 함께 보내고 답이 말풍선으로', P1, async ({ page }) => {
    await openApp(page, '#/chat');
    const request = page.waitForRequest(r => r.url().includes('/api/chat'));
    await page.locator('#chat-form input[name="q"]').fill('학생식당 어디야');
    await page.locator('#chat-form input[name="q"]').press('Enter');
    const body = JSON.parse((await request).postData());
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('학생식당');
    await expect(page.locator('.chat-msg.bot').last()).toContainText('대학본부 복지관 1층');
  });

  test.describe('AI 연결 실패', () => {
    test.use({ chatReply: null });
    test('H2 AI 서버 오류: 안내 문구가 나오고 다시 물을 수 있다', P1, async ({ page, errors }) => {
      await openApp(page, '#/chat');
      await page.locator('#chat-form input[name="q"]').fill('학생식당 어디야');
      await page.locator('#chat-form input[name="q"]').press('Enter');
      await expect(page.locator('.chat-msg.bot.error')).toContainText('응답 오류');
      await expect(page.locator('#chat-form button[type="submit"]')).toBeEnabled();
      // 서버가 500 을 돌려준 것은 의도한 상황
      errors.splice(0, errors.length, ...errors.filter(e => !/500/.test(e)));
    });
  });

  test('H3 이모티콘을 보내면 이모티콘 말풍선이 생긴다', P1, async ({ page }) => {
    await openApp(page, '#/chat');
    await page.locator('#chat-form [data-sticker-toggle]').click();
    await page.locator('.chat-page .sticker-panel [data-sticker]').first().click();
    await expect(page.locator('.chat-msg.me.sticker-msg')).toHaveCount(1);
  });
});
