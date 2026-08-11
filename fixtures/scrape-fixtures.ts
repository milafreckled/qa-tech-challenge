import { test as base } from '@playwright/test';
import { CsvWriter } from '../utils/csv-writer';
import { PullRequestsPage } from '../pages/pullrequests.page';

const OUT_FILE = 'open-pulls.csv';

interface ScrapeFixtures {
  pullRequestsPage: PullRequestsPage;
  csv: CsvWriter;
}

type ScrapeOptions = {
  /** owner/name */
  repo: string;
};

export const test = base.extend<ScrapeFixtures & ScrapeOptions>({
  // Option fixture – set in playwright.config.ts, overridable with `--repo=…`
  repo: ['appwrite/appwrite', { option: true }],
  pullRequestsPage: async ({ page, repo }, use) => {
    const SKIPPED_RESOURCES = ['image', 'font', 'media', 'stylesheet'];
    await page.route('**/*', (route) =>
      SKIPPED_RESOURCES.includes(route.request().resourceType())
        ? route.abort()
        : route.continue(),
    );
    await use(new PullRequestsPage(page, repo));
  },
  csv: async ({}, use, testInfo) => {
    const writer = new CsvWriter(testInfo.outputPath(OUT_FILE));
    await use(writer);
    await writer.close();
    // Ships the CSV inside the HTML report / CI artifacts – no separate upload step.
    await testInfo.attach(OUT_FILE, { path: writer.path, contentType: 'text/csv' });
  },
});
