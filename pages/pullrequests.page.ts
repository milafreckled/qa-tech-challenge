import { expect, type Locator, type Page } from '@playwright/test';
import type { PullRequest } from '../data';

/** Single place to change when GitHub reshuffles its markup. */
const PR_SELECTORS = {
  name: 'a[data-hovercard-type="pull_request"]',
  createdAt: 'relative-time',
  author: 'span.opened-by a[data-hovercard-type="user"]',
};

const GITHUB_BASE_URL = 'https://github.com';

export class PullRequestsPage {
  readonly rows: Locator;
  readonly emptyState: Locator;
  /** The pager renders twice (desktop + mobile containers) – always take the first. */
  readonly nextPageLink: Locator;
  readonly currentPageLink: Locator;

  constructor(private readonly page: Page, private readonly repo: string) {
    this.rows = page.locator('div.js-issue-row');
    this.emptyState = page.locator('.blankslate');
    this.nextPageLink = page.getByRole('link', { name: 'Next page' }).first();
    this.currentPageLink = page.locator('.paginate-container a.current').first();
  }

  async open(query: string): Promise<void> {
    const params = new URLSearchParams({ q: query });
    await this.page.goto(GITHUB_BASE_URL + `/${this.repo}/pulls?${params}`, { waitUntil: 'domcontentloaded' });
    await this.waitForList();
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(GITHUB_BASE_URL + url, { waitUntil: 'domcontentloaded' });
    await this.waitForList();
  }

  /* Settled - either the list rendered, or GitHub says there is nothing to show. */
  private async waitForList(): Promise<void> {
    await expect(this.rows.or(this.emptyState).first()).toBeAttached();
  }

  /* Reads every row in one round-trip to the browser and extract 3 fields per row.*/
  async readRows(): Promise<PullRequest[]> {
    return this.rows.evaluateAll(
      (rows, sel) =>
        rows.map((row) => {
          const link = row.querySelector<HTMLAnchorElement>(sel.name);
          const time = row.querySelector(sel.createdAt);
          const author = row.querySelector(sel.author);
          return {
            number: Number(row.id.replace('issue_', '')),
            name: link?.textContent?.trim() ?? '',
            createdAt: time?.getAttribute('datetime') ?? '',
            author: author?.textContent?.trim() ?? 'unknown',
          };
        }),
      PR_SELECTORS,
    );
  }

  /* Page count GitHub *claims* for the current query. */
  async claimedPageCount(): Promise<number> {
    if ((await this.currentPageLink.count()) === 0) return 1;
    return Number((await this.currentPageLink.getAttribute('data-total-pages')) ?? 1);
  }

  /** @returns href of the next page, or null when this was the last one. */
  async nextPageUrl(): Promise<string | null> {
    if ((await this.nextPageLink.count()) === 0) return null;
    return this.nextPageLink.getAttribute('href');
  }
}