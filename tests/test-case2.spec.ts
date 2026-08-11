import { test, expect } from '../fixtures/base';
import { checkLinkStatuses } from '../utils/link-checker';

test.describe('Link status codes', () => {
  test('all links return 2xx or 3xx, no 4xx', async ({ homePage, request }) => {
    await homePage.goto();

    const links = await homePage.getAllLinks();
    expect(links.length, 'No links found on the page').toBeGreaterThan(0);

    const results = await checkLinkStatuses(request, links);
    const failures = results
      .filter((result) => !result.ok)
      .map((result) => `${result.url} → ${result.error ?? result.status}`);

    expect(
      failures,
      `The following links failed or returned 4xx status codes:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });
});
