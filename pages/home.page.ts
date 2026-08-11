import { BasePage } from './base.page';

export class HomePage extends BasePage {
  /** All unique absolute http(s) links found on the page. */
  async getAllLinks(): Promise<string[]> {
    const hrefs = await this.page.$$eval('a[href]', (anchors) =>
      anchors
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href) => href.startsWith('http'))
    );
    return [...new Set(hrefs)];
  }
}
