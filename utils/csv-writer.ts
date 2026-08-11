import { createWriteStream, type WriteStream } from 'node:fs';
import type { PullRequest } from '../data';

/** Streams rows to disk – memory stays flat whether the repo has 50 or 50 000 PRs. */
export class CsvWriter {
  private readonly stream: WriteStream;
  private count = 0;

  constructor(readonly path: string) {
    this.stream = createWriteStream(path, { encoding: 'utf8' });
   // this.stream.write('\uFEFF'); // BOM so Excel opens UTF-8 correctly
    this.writeRow(['lp', 'name', 'created_at', 'author']);
  }

  get rowCount(): number {
    return this.count;
  }

  write(pr: PullRequest): void {
    this.count++;
    this.writeRow([this.count, pr.name, pr.createdAt, pr.author]);
  }

  /** RFC 4180 quoting – commas, quotes and newlines in PR titles survive intact. */
  private writeRow(values: (string | number)[]): void {
    const line = values.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    this.stream.write(line + '\n');
  }

  close(): Promise<void> {
    return new Promise((resolve) => this.stream.end(resolve));
  }
}