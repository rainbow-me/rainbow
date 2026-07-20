import type { Report } from '../report';
import { baselineState } from './baseline-state';
import { pending } from './pending';

/**
 * Markdown report for the CI step summary and the sticky PR comment.
 *
 * Two zones. Zone 1: pending occurrences that still need action, closed by
 * their remedy. Zone 2 under Baseline state: the committed artifact — the
 * table, then the receipts for this change's writes to it. An entry graduates
 * from zone 1 to zone 2 the moment it is committed to a baseline.
 */
export function renderMarkdown(report: Report): string {
  return ['## Dependency rules', pending.markdown(report), baselineState.markdown(report)].filter(Boolean).join('\n\n');
}
