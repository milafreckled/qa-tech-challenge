import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
    readonly usernameInput: Locator;
    readonly passwordInput: Locator
    readonly loginButton: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.locator('#username');
        this.passwordInput = page.locator('#password');
        this.loginButton = page.getByRole('button', { name: 'Login' });
    
    }

   async goto(): Promise<void> {
    await this.page.goto('login');
   }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    let loginHeader = this.page.getByRole('heading', { name: `Welcome, ${username}` });
    await expect(loginHeader).toBeVisible();
  }
}