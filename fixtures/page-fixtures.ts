import { test as base } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { AboutPage } from '../pages/about.page';

interface PageFixtures {
  homePage: HomePage;
  loginPage: LoginPage;
  aboutPage: AboutPage;
  consoleErrors: string[];
}

export const test = base.extend<PageFixtures>({
  // Registered before the test body runs, so it also catches errors fired
  // during page.goto() (e.g. inline <script> tags that run while the page loads).
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await use(errors);
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  aboutPage: async ({ page }, use) => {
    await use(new AboutPage(page));
  },
  loginPage: async ({ page }, use) => {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
});
