import { test } from '@playwright/test';
import type { PullRequestsPage } from '../pages/pullrequests.page';
import type { PullRequest } from '../data';


const THROTTLE_MS = Number(process.env.THROTTLE_MS ?? 300);

/** GitHub's created: filter has second resolution, so windows are measured in seconds. */
const iso = (d: Date) =>
  new Date(Math.floor(d.getTime() / 1000) * 1000).toISOString().replace('.000', '');
// const addSeconds = (d: Date, n: number) => new Date(d.getTime() + n * 1000);
// const spanInSeconds = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / 1000);

/**
 * Every navigation is a fresh URL, so the sort has to travel with each query -
 * but it is written in code once.
 *
 * sort:created-asc keeps the result order stable while we paginate.
 * Under the default (newest first) a PR opened mid-crawl pushes every
 * later row down a position, so pages we already visited shift and we re-read rows.
 */
function buildQuery(filter: string, window?: { from: Date; to: Date }): string {
  const parts = [filter, 'sort:created-asc'];
  if (window) parts.push(`created:${iso(window.from)}..${iso(window.to)}`);
  return parts.join(' ');
}

/**
 * Follows the "Next" link until it disappears.
 * Assumes the first page of the query is already opened.
 */
async function* paginate(pulls: PullRequestsPage) {
  for (let pageIndex = 1; ; pageIndex++) {
    yield* await test.step(`page ${pageIndex}`, () => pulls.readRows());

    const nextUrl = await pulls.nextPageUrl();
    if (!nextUrl) return;

    await new Promise((r) => setTimeout(r, THROTTLE_MS));
    await pulls.goto(nextUrl);
  }
}

/**
 * Walks [from, to] as creation-time windows, halving any window GitHub will not
 * paginate fully.
 *
 * Splitting on timestamps rather than dates matters: a single busy day can hold more
 * PRs than one query will serve. 
 * Second-granularity keeps halving into hours and minutes.
 * Each half is strictly shorter, so the recursion terminates - the floor is a
 * one-second window, which no repo can overflow.
 */
export async function* crawlByWindows(
  pulls: PullRequestsPage,
  filter: string,
  from: Date,
  to: Date,
): AsyncGenerator<PullRequest> {
  await new Promise((r) => setTimeout(r, THROTTLE_MS));
  await pulls.open(buildQuery(filter, { from, to }));
  const pages = await pulls.claimedPageCount();
//   const canSplit =  spanInSeconds(from, to) >= 1;

//   if (canSplit) {
//     const mid = addSeconds(from, Math.floor(spanInSeconds(from, to) / 2));
//     yield* crawlByWindows(pulls, filter, from, mid);
//     yield* crawlByWindows(pulls, filter, addSeconds(mid, 1), to);
//     return;
//   }

  const collected = await test.step(`window ${iso(from)} .. ${iso(to)}`, async () => {
    const rows: PullRequest[] = [];
    for await (const pr of paginate(pulls)) rows.push(pr);
    return rows;
  });

  // Recording the count per window to distinguish betwenn empty windows and silent failures
  test.info().annotations.push({
    type: 'window',
    description: `${iso(from)}..${iso(to)} -> ${collected.length} PR(s), ${pages} page(s)`,
  });

  yield* collected;
}

/** Oldest matching PR date, read from the site instead of hardcoded. */
export async function findOldestPrDate(pulls: PullRequestsPage, filter: string): Promise<Date> {
  await pulls.open(buildQuery(filter));
  const [oldest] = await pulls.readRows();
  if (!oldest?.createdAt) throw new Error(`No pull requests matched "${filter}".`);
  return new Date(oldest.createdAt);
}
