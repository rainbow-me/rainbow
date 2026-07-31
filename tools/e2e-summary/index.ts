/**
 * Renders the per-shard e2e ledgers written by `scripts/e2e-run.sh` into a
 * single markdown table for `$GITHUB_STEP_SUMMARY`.
 *
 * Usage: node tools/e2e-summary/index.ts <resultsDir>
 */
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Most severe first: this order is the table's sort order, the headline's order,
// and the whitelist for statuses read off disk.
const ORDER = ['failed', 'planned', 'retried', 'passed'] as const;

type Status = (typeof ORDER)[number];

type Row = {
  status: Status;
  test: string;
  shard: number;
  attempts: number | null;
  duration: number | null;
};

const EMOJI: Record<Status, string> = { failed: '❌', planned: '🚫', retried: '⚠️', passed: '✅' };
const LABEL: Record<Status, string> = { failed: 'failed', planned: 'did not run', retried: 'retried', passed: 'passed' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStatus(value: unknown): value is Status {
  return ORDER.some(status => status === value);
}

function readLedgers(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter(name => name.endsWith('.jsonl'))
    .flatMap(name =>
      readFileSync(join(dir, name), 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .flatMap(line => {
          try {
            const parsed: unknown = JSON.parse(line);
            return isRecord(parsed) ? [parsed] : [];
          } catch {
            console.error(`skipping unparseable line in ${name}: ${line}`);
            return [];
          }
        })
    );
}

// Ledger rows are uniform and append-only, so the last row for a test wins. One
// still reading "planned" was never superseded by a finished row, which is what a
// test that never ran looks like.
function toRows(records: Record<string, unknown>[]): Row[] {
  const rows = new Map<string, Row>();

  for (const record of records) {
    if (typeof record.test !== 'string' || !isStatus(record.status)) continue;
    rows.set(record.test, {
      status: record.status,
      test: record.test,
      shard: typeof record.shard === 'number' ? record.shard : 0,
      attempts: typeof record.attempts === 'number' ? record.attempts : null,
      duration: typeof record.duration === 'number' ? record.duration : null,
    });
  }

  return [...rows.values()].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.test.localeCompare(b.test));
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

function slowestShard(rows: Row[]): number | null {
  const totals = new Map<number, number>();
  for (const row of rows) {
    if (row.duration === null) continue;
    totals.set(row.shard, (totals.get(row.shard) ?? 0) + row.duration);
  }
  return totals.size === 0 ? null : Math.max(...totals.values());
}

function artifactsLink(): string | null {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  if (!GITHUB_SERVER_URL || !GITHUB_REPOSITORY || !GITHUB_RUN_ID) return null;
  return `[artifacts](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}#artifacts)`;
}

function render(rows: Row[]): string {
  if (rows.length === 0) {
    return 'No e2e results were reported. Look into the shard jobs instead.\n';
  }

  const counts = rows.reduce<Partial<Record<Status, number>>>((acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }), {});
  const headline = ORDER.filter(status => counts[status])
    .map(status => `${counts[status]} ${LABEL[status]}`)
    .join(' · ');

  const slowest = slowestShard(rows);
  const parts = [`**${headline}**`];
  if (slowest !== null) parts.push(`slowest shard ${formatDuration(slowest)}`);
  const link = artifactsLink();
  if (link) parts.push(link);

  const table = [
    '|  | Test | Shard | Attempts | Time |',
    '| :-- | :-- | --: | --: | --: |',
    ...rows.map(row => {
      const cells = [
        EMOJI[row.status],
        `\`${row.test}\``,
        String(row.shard),
        row.attempts === null ? '' : String(row.attempts),
        row.duration === null ? '' : formatDuration(row.duration),
      ];
      return `| ${cells.join(' | ')} |`;
    }),
  ];

  return `${parts.join(' · ')}\n\n${table.join('\n')}\n`;
}

function main(): void {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node tools/e2e-summary/index.ts <resultsDir>');
    process.exit(1);
  }

  let markdown: string;

  try {
    markdown = render(toRows(readLedgers(dir)));
  } catch (error) {
    markdown = `Could not render the e2e summary: \`${error instanceof Error ? error.message : String(error)}\`\n`;
    console.error(error);
  }

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    appendFileSync(summaryPath, markdown);
  } else {
    console.log(markdown);
  }
}

main();
