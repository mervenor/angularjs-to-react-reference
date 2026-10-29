import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Automated checks catch roughly a third of accessibility problems. They are
// a floor, not a certificate: we also checked keyboard use by hand.
const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();

const summary = (violations: Awaited<ReturnType<typeof scan>>['violations']) =>
  violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} element(s)`);

test('the phone list has no detectable accessibility violations', async ({ page }) => {
  await page.goto('phones');
  await expect(page.locator('.phones li')).toHaveCount(20);
  expect(summary((await scan(page)).violations)).toEqual([]);
});

test('the phone detail page has no detectable accessibility violations', async ({ page }) => {
  await page.goto('phones/nexus-s');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nexus S');
  expect(summary((await scan(page)).violations)).toEqual([]);
});

test('the thumbnails can be used with the keyboard', async ({ page }) => {
  await page.goto('phones/nexus-s');
  const thumb = page.getByRole('button', { name: 'Show image 3 of 4' });
  await thumb.focus();
  await page.keyboard.press('Enter');
  await expect(thumb).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('img.phone.selected')).toHaveAttribute('src', /nexus-s\.2\.jpg$/);
});
