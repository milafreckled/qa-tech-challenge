import { PullRequest } from '../data';
import { test, expect } from '../fixtures/base';
import { crawlByWindows, findOldestPrDate } from '../utils/crawler';

test('exports every open pull request to CSV', async ({ pullRequestsPage, csv }) => {
  test.setTimeout(120_000);

  const seen = new Set<number>();
  const filter = 'is:open is:pr';

  const from = await test.step('find the oldest open PR', () => findOldestPrDate(pullRequestsPage, filter));

  for await (const pr of crawlByWindows(pullRequestsPage, filter, from, new Date())) {
    if (seen.has(pr.number)) continue;
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

test('exports pull requests with API', async ({ request, repo, csv, pullRequestsPage }) => {
  const perPage = 100;
  const filter = 'is:open is:pr';

  await pullRequestsPage.open(filter);
  const pages = await pullRequestsPage.claimedPageCount();

  for (let page = 1; page <= pages; page++) {
    const response = await request.get(`https://api.github.com/repos/${repo}/pulls`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10"
      },
      params: { per_page: perPage, page },
    });
    const prs: PullRequest[] = Array.from(await response.json()).map((pr: any) => ({
      number: pr.number,
      name: pr.title,
      createdAt: pr.created_at,
      author: pr.user.login
    }));
    for (const pr of prs) {
      csv.write(pr);
    }
  }

  expect(csv.rowCount, 'expected at least one open PR').toBeGreaterThan(0);
})
