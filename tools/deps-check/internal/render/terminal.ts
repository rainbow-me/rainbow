import type { Report } from '../report';
import { baselineState } from './baseline-state';
import { pending } from './pending';

/** Human-readable terminal report: the pending zone, then the baseline state block. */
export function renderTerminal(report: Report): string {
  return [pending.terminal(report), baselineState.terminal(report)].filter(Boolean).join('\n\n');
}
