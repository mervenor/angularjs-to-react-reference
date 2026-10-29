import { expect, test, type Page } from '@playwright/test';

/*
 * Characterisation tests: they record what the ORIGINAL AngularJS app does,
 * quirks included, and must stay green at every migration step.
 *
 * Rules we follow so the suite survives a change of framework:
 * - drive the page like a user (type, click, navigate), never reach into
 *   AngularJS or React internals;
 * - select by role or by the CSS classes the stylesheet already depends on;
 * - keep everything that is allowed to change in ONE place (`urls` below).
 */

// The only framework-specific detail: what the address bar looks like.
// Step 4 changed it from AngularJS hash URLs (index.html#!/phones) to clean paths.
const urls = {
  list: 'phones',
  detail: (id: string) => `phones/${id}`,
  isList: /\/phones$/,
  isDetail: (id: string) => new RegExp(`/phones/${id}$`),
};

const phoneItems = (page: Page) => page.locator('.phones li');
const phoneNames = (page: Page) => page.locator('.phones li a:not(.thumb)');
const searchBox = (page: Page) => page.getByRole('textbox');
const sortSelect = (page: Page) => page.getByRole('combobox');

async function allImagesLoaded(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((imgs) =>
    imgs.every((img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0),
  );
}

test.describe('routing', () => {
  test('the site root shows the phone list', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveURL(urls.isList);
    await expect(phoneItems(page)).toHaveCount(20);
  });

  test('index.html redirects to the phone list', async ({ page }) => {
    await page.goto('index.html');
    await expect(page).toHaveURL(urls.isList);
  });

  test('an unknown route redirects to the phone list', async ({ page }) => {
    await page.goto('index.html#!/no-such-page');
    await expect(page).toHaveURL(urls.isList);
    await expect(phoneItems(page)).toHaveCount(20);
  });

  test('a phone page can be opened directly (deep link)', async ({ page }) => {
    await page.goto(urls.detail('nexus-s'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nexus S');
  });

  test('the browser back button returns from a phone to the list', async ({ page }) => {
    await page.goto(urls.list);
    await phoneNames(page).filter({ hasText: 'Nexus S' }).click();
    await expect(page).toHaveURL(urls.isDetail('nexus-s'));
    await page.goBack();
    await expect(page).toHaveURL(urls.isList);
    await expect(phoneItems(page)).toHaveCount(20);
  });
});

test.describe('old AngularJS URLs (added in step 4)', () => {
  test('a bookmarked phone page still opens the phone', async ({ page }) => {
    await page.goto('index.html#!/phones/nexus-s');
    await expect(page).toHaveURL(urls.isDetail('nexus-s'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nexus S');
  });

  test('a bookmarked list page still opens the list', async ({ page }) => {
    await page.goto('index.html#!/phones');
    await expect(page).toHaveURL(urls.isList);
    await expect(phoneItems(page)).toHaveCount(20);
  });

  test('pre-1.6 hash URLs without "!" are handled too', async ({ page }) => {
    await page.goto('#/phones/nexus-s');
    await expect(page).toHaveURL(urls.isDetail('nexus-s'));
  });

  test('an unknown clean path redirects to the list', async ({ page }) => {
    await page.goto('no-such-page');
    await expect(page).toHaveURL(urls.isList);
  });
});

test.describe('phone list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urls.list);
    await expect(phoneItems(page)).toHaveCount(20);
  });

  test('lists all 20 phones, newest first, by default', async ({ page }) => {
    await expect(sortSelect(page)).toHaveValue('age');
    expect(JSON.stringify(await phoneNames(page).allTextContents(), null, 2)).toMatchSnapshot(
      'list-order-newest.json',
    );
  });

  test('sorts alphabetically, ignoring case', async ({ page }) => {
    await sortSelect(page).selectOption('name');
    expect(JSON.stringify(await phoneNames(page).allTextContents(), null, 2)).toMatchSnapshot(
      'list-order-alphabetical.json',
    );
  });

  test('filters the list as the user types', async ({ page }) => {
    await searchBox(page).fill('nexus');
    await expect(phoneItems(page)).toHaveCount(1);
    await searchBox(page).fill('motorola');
    await expect(phoneItems(page)).toHaveCount(8);
    await searchBox(page).fill('');
    await expect(phoneItems(page)).toHaveCount(20);
  });

  test('search and sort combine (upstream e2e scenario)', async ({ page }) => {
    await searchBox(page).fill('tablet');
    await expect(phoneNames(page)).toHaveText(['Motorola XOOM™ with Wi-Fi', 'MOTOROLA XOOM™']);
    await sortSelect(page).selectOption('name');
    await expect(phoneNames(page)).toHaveText(['MOTOROLA XOOM™', 'Motorola XOOM™ with Wi-Fi']);
  });

  // Quirks of AngularJS's `filter` filter that real users may rely on.
  test('search also matches fields that are not shown, such as the carrier', async ({ page }) => {
    // Neither phone has "Verizon" in its name or snippet; only in `carrier`.
    await searchBox(page).fill('verizon');
    await expect(phoneNames(page)).toHaveText(['DROID™ 2 Global by Motorola', 'DROID™ Pro by Motorola']);
  });

  test('search matches hidden image file names, so "jpg" matches every phone', async ({ page }) => {
    await searchBox(page).fill('jpg');
    await expect(phoneItems(page)).toHaveCount(20);
  });

  test('a leading "!" negates the search', async ({ page }) => {
    await searchBox(page).fill('!motorola');
    await expect(phoneItems(page)).toHaveCount(12);
  });

  test('each phone links to its own page', async ({ page }) => {
    await searchBox(page).fill('nexus');
    await phoneNames(page).first().click();
    await expect(page).toHaveURL(urls.isDetail('nexus-s'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nexus S');
  });

  test('both the thumbnail and the name link to the phone', async ({ page }) => {
    const first = phoneItems(page).first();
    await first.locator('a.thumb').click();
    await expect(page).toHaveURL(urls.isDetail('motorola-xoom-with-wi-fi'));
  });

  // Added in step 5 after removing Bootstrap broke this layout and no test noticed.
  // It passes against the original app (step 0) too.
  test('each thumbnail image fits inside its 100px link box', async ({ page }) => {
    await expect.poll(() => allImagesLoaded(page, '.phones li img')).toBe(true);
    const overflowing = await page.locator('.phones li a.thumb').evaluateAll((links) =>
      links.filter((link) => {
        const box = link.getBoundingClientRect();
        const img = link.querySelector('img')!.getBoundingClientRect();
        return img.width > box.width + 0.5 || img.height > box.height + 0.5;
      }).length,
    );
    expect(overflowing).toBe(0);
  });

  test('every thumbnail image loads', async ({ page }) => {
    await expect.poll(() => allImagesLoaded(page, '.phones li img')).toBe(true);
  });
});

test.describe('phone detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urls.detail('nexus-s'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nexus S');
  });

  test('shows the description and every specification', async ({ page }) => {
    await expect(page.getByText(/^Nexus S is the next generation of Nexus devices/)).toBeVisible();

    // Read the specs as structured data so the snapshot survives markup changes.
    const specs = await page.locator('.specs > li').evaluateAll((sections) =>
      sections.map((section) => ({
        section: section.firstElementChild?.textContent?.trim(),
        // 'p' added in step 5, when the invalid <dd> under "Additional Features" became a <p>.
        entries: Array.from(section.querySelectorAll('dt, dd, p')).map(
          (el) => `${el.tagName.toLowerCase()}: ${el.textContent?.trim()}`,
        ),
      })),
    );
    expect(JSON.stringify(specs, null, 2)).toMatchSnapshot('nexus-s-specs.json');
  });

  test('shows booleans as a tick or a cross', async ({ page }) => {
    await expect(page.locator('.specs dt:text-is("GPS") + dd')).toHaveText('✓');
    await expect(page.locator('.specs dt:text-is("Infrared") + dd')).toHaveText('✘');
  });

  const selectedImage = (page: Page) =>
    page.locator('img.phone.selected').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));

  test('shows the first image as the main image', async ({ page }) => {
    await expect.poll(() => selectedImage(page)).toEqual([expect.stringMatching(/img\/phones\/nexus-s\.0\.jpg$/)]);
  });

  test('clicking a thumbnail swaps the main image', async ({ page }) => {
    const thumbs = page.locator('.phone-thumbs img');
    await expect(thumbs).toHaveCount(4);
    await thumbs.nth(2).click();
    await expect.poll(() => selectedImage(page)).toEqual([expect.stringMatching(/img\/phones\/nexus-s\.2\.jpg$/)]);
    await thumbs.nth(0).click();
    await expect.poll(() => selectedImage(page)).toEqual([expect.stringMatching(/img\/phones\/nexus-s\.0\.jpg$/)]);
  });

  test('every image on the page loads', async ({ page }) => {
    await expect.poll(() => allImagesLoaded(page, '.phone-thumbs img')).toBe(true);
    await expect.poll(() => allImagesLoaded(page, 'img.phone.selected')).toBe(true);
  });

});

test('a phone with empty optional data still renders', async ({ page }) => {
  await page.goto(urls.detail('motorola-atrix-4g'));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MOTOROLA ATRIX™ 4G');
  await expect(page.locator('.specs dt:text-is("Features") + dd')).toHaveText('');
});
