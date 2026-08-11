export interface PullRequest {
  /** GitHub PR number – used only to de-dup overlapping crawl windows, not written to CSV. */
  number: number;
  name: string;
  createdAt: string;
  author: string;
}
