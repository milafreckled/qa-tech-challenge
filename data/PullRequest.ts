export interface PullRequest {
  /** GitHub PR number – used only for deduplication, not written to CSV. */
  number: number;
  name: string;
  createdAt: string;
  author: string;
}
