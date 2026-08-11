import { APIRequestContext } from '@playwright/test';
import { LinkCheckResult } from '../data';

const DEFAULT_CONCURRENCY = 5;

/**
 * Checks each URL's HTTP status with bounded concurrency 
 * (to avoid hitting rate limits)
 */
export async function checkLinkStatuses(
  request: APIRequestContext,
  urls: string[],
  concurrency: number = DEFAULT_CONCURRENCY
): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = new Array(urls.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < urls.length) {
      const current = nextIndex++;
      results[current] = await checkSingleLink(request, urls[current]);
    }
  }

  const workerCount = Math.min(concurrency, urls.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

async function checkSingleLink(
  request: APIRequestContext,
  url: string
): Promise<LinkCheckResult> {
  try {
    // maxRedirects: 0 captures the raw status, so that 3xx statuses are explicitly visible as passing
    const response = await request.get(url, { maxRedirects: 0 });
    const status = response.status();
    return { url, status, ok: status < 400 };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
