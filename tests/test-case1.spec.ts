import { test, expect } from '../fixtures/base';

test('start page has no console errors', async ({ homePage, consoleErrors }) => {
  await homePage.goto();
  expect(consoleErrors).toHaveLength(0);
});

test('about page has intentional error message', async ({ aboutPage, consoleErrors }) => {
  await aboutPage.goto();
  expect(consoleErrors).toContain('This is an intentional error message!');
});
