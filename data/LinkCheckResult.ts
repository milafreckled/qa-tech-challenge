export interface LinkCheckResult {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}
