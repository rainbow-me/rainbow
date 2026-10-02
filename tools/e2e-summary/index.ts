/**
 * Renders the per-shard e2e ledgers written by `scripts/e2e-run.sh` into a
 * single markdown table for `$GITHUB_STEP_SUMMARY`.
 *
 * Usage: node tools/e2e-summary/index.ts <resultsDir> [expectedShards]
 */
import { appendFileSync } from 'node:fs';

import { renderSummary } from './report.ts';

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
    markdown = renderSummary(dir, expected);
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
