import { mergeTests } from '@playwright/test';
import { test as pageTest } from './page-fixtures';
import { test as scrapeTest } from './scrape-fixtures';

export const test = mergeTests(pageTest, scrapeTest);
export { expect } from '@playwright/test';
