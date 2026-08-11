import { test, expect } from '../fixtures/base';
import { crawlByWindows, findOldestPrDate } from '../utils/crawler';

test('exports every open pull request to CSV', async ({ pullRequestsPage, csv }) => {
  test.setTimeout(120_000);

  const seen = new Set<number>();
  const filter = 'is:open is:pr';

  const from = await test.step('find the oldest open PR', () => findOldestPrDate(pullRequestsPage, filter));

  for await (const pr of crawlByWindows(pullRequestsPage, filter, from, new Date())) {
    if (seen.has(pr.number)) continue; // date windows overlap at the edges
    seen.add(pr.number);

    // A broken selector must fail the run loudly, not quietly write empty columns.
    expect
      .soft(pr, `PR #${pr.number} is missing fields – selectors may have drifted`)
      .toMatchObject({
        name: expect.stringMatching(/\S/),
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        author: expect.stringMatching(/\S/),
      });

    csv.write(pr);
  }

  expect(csv.rowCount, 'expected at least one open PR').toBeGreaterThan(0);
});