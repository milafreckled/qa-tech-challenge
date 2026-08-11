import { BasePage } from './base.page';

export class AboutPage extends BasePage {
  async goto(): Promise<void> {
    await super.goto('about');
  }
}
