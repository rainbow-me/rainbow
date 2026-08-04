/**
 * Renders the per-shard e2e ledgers written by `scripts/e2e-run.sh` into a
 * single markdown table for `$GITHUB_STEP_SUMMARY`.
 *
 * Usage: node tools/e2e-summary/index.ts <resultsDir> [expectedShards]
 */
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Most severe first: this order is the table's sort order and the headline's
// order. `unreported` leads because it says the rest of the table is incomplete,
// which has to be read before anything in it.
const ORDER = ['unreported', 'failed', 'planned', 'retried', 'passed'] as const;

type Status = (typeof ORDER)[number];

// Everything a shard can write about a test. `unreported` is ours, synthesized
// for a shard that wrote nothing, so it is deliberately not readable off disk.
const REPORTABLE = ORDER.filter((status): status is Exclude<Status, 'unreported'> => status !== 'unreported');

type Row = {
  status: Status;
  test: string;
  shard: number;
  attempts: number | null;
  duration: number | null;
};

const EMOJI: Record<Status, string> = { unreported: '❓', failed: '❌', planned: '🚫', retried: '⚠️', passed: '✅' };
const LABEL: Record<Status, string> = {
  unreported: 'did not report',
  failed: 'failed',
  planned: 'did not run',
  retried: 'retried',
  passed: 'passed',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStatus(value: unknown): value is Status {
  return REPORTABLE.some(status => status === value);
}

function ledgerName(shard: number): string {
  return `shard-${shard}.jsonl`;
}

// A shard writes its ledger before running anything, so an absent file means the
// runner died before the script started or the upload found nothing. Either way
// that shard's tests are missing from the table entirely, and without this the
// table looks complete.
function unreportedShards(dir: string, expected: number): number[] {
  const shards = [];
  for (let shard = 1; shard <= expected; shard++) {
    if (!existsSync(join(dir, ledgerName(shard)))) shards.push(shard);
  }
  return shards;
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
function toRows(records: Record<string, unknown>[], unreported: number[]): Row[] {
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

  for (const shard of unreported) {
    rows.set(ledgerName(shard), { status: 'unreported', test: '_no results uploaded_', shard, attempts: null, duration: null });
  }

  // Test names are unique, so the shard tiebreak only ever orders the synthesized
  // rows, which all carry the same text.
  return [...rows.values()].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.test.localeCompare(b.test) || a.shard - b.shard
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

function render(rows: Row[], unreported: number[]): string {
  if (rows.length === 0) {
    return 'No e2e results were reported. Look into the shard jobs instead.\n';
  }

  const counts = rows.reduce<Partial<Record<Status, number>>>((acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }), {});
  const headline = ORDER.filter(status => counts[status])
    .map(status => `${counts[status]} ${LABEL[status]}`)
    .join(' · ');

  const table = [
    '|  | Test | Shard | Attempts | Time |',
    '| :-- | :-- | --: | --: | --: |',
    ...rows.map(row => {
      const cells = [
        EMOJI[row.status],
        row.status === 'unreported' ? row.test : `\`${row.test}\``,
        String(row.shard),
        row.attempts === null ? '' : String(row.attempts),
        row.duration === null ? '' : formatDuration(row.duration),
      ];
      return `| ${cells.join(' | ')} |`;
    }),
  ];

  const caveat =
    unreported.length === 0
      ? ''
      : `> [!WARNING]\n> ${unreported.length === 1 ? `Shard ${unreported[0]} uploaded nothing, so its tests are` : `Shards ${unreported.join(', ')} uploaded nothing, so their tests are`} missing from this table entirely.\n\n`;

  return `**${headline}**\n\n${caveat}${table.join('\n')}\n`;
}

function main(): void {
  const [, , dir, expectedShards] = process.argv;
  if (!dir) {
    console.error('usage: node tools/e2e-summary/index.ts <resultsDir> [expectedShards]');
    process.exit(1);
  }

  const expected = Number(expectedShards ?? 0);
  if (!Number.isInteger(expected) || expected < 0) {
    console.error(`expectedShards must be a non-negative integer, got: ${expectedShards}`);
    process.exit(1);
  }

  let markdown: string;

  try {
    const unreported = unreportedShards(dir, expected);
    markdown = render(toRows(readLedgers(dir), unreported), unreported);
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
