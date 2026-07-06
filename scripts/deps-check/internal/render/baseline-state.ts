import { policyFor } from '../../policies';
import type { Report } from '../report';
import type { TaggedViolation } from '../violation';
import { violationEntry } from './entry';

/**
 * Zone 2: the committed baseline artifact — the per-rule state table and the
 * receipts for this change's writes to it. Pending occurrences never appear
 * here; an entry graduates in from the pending zone once it is committed.
 */
export const baselineState = {
  /** Mirrors the markdown table's cells; shown on every run. */
  terminal(report: Report): string {
    const lines = stateRows(report).map(row => {
      const label = row.platform ? `${row.rule} [${row.platform}]` : row.rule;
      return `  ${label}: ${cell(report, row)}`;
    });
    return lines.length > 0 ? ['Baseline state:', ...lines].join('\n') : '';
  },

  markdown(report: Report): string {
    return ['### Baseline state', table(report), ...receipts(report)].join('\n\n');
  },
};

// The table is purely about the baseline artifact: its committed size and,
// when this change moved it, base → head with the movement spelled out.
function table(report: Report): string {
  return [
    '| Rule | Platform | Baseline |',
    '|---|---|--:|',
    ...stateRows(report).map(row => `| \`${row.rule}\` | ${row.platform ?? 'all'} | ${cell(report, row)} |`),
  ].join('\n');
}

/** Receipts for this change's baseline writes: ⚠️ grandfathered (attention first), then 🟢 banked. */
function receipts(report: Report): string[] {
  const entryItem = (tagged: TaggedViolation): string => violationEntry.markdown(tagged, report.results.length);

  const grandfathered = groupByRule(report.grandfathered).map(([rule, entries]) =>
    [
      `#### ⚠️ ${policyFor(rule).label} — ${entries.length} grandfathered`,
      entries.map(entryItem).join('\n'),
      'Added to the baseline by this change through `--allow-additions`. Confirm this is intended.',
    ].join('\n\n')
  );

  const banked = groupByRule(report.banked).map(([rule, entries]) =>
    [`#### 🟢 ${policyFor(rule).label} — ${entries.length} fixed and banked`, entries.map(entryItem).join('\n')].join('\n\n')
  );

  return [...grandfathered, ...banked];
}

/**
 * A row's committed baseline count; `base → head (movement)` when this change
 * grandfathered or banked entries. A bare count means the artifact did not
 * move (or no base ref was readable, which is indistinguishable and fine).
 */
function cell(report: Report, row: StateRow): string {
  const grandfathered = deltaCount(report.grandfathered, row);
  const banked = deltaCount(report.banked, row);
  const movement = [grandfathered > 0 && `⚠️ +${grandfathered} grandfathered`, banked > 0 && `🟢 -${banked} banked`]
    .filter(Boolean)
    .join(', ');
  if (!movement) {
    return `${row.count}`;
  }
  return `${row.count - grandfathered + banked} → ${row.count} (${movement})`;
}

/** How many of this change's banked/grandfathered entries land on a state row. */
function deltaCount(tagged: TaggedViolation[], row: StateRow): number {
  return tagged.filter(t => t.violation.rule.name === row.rule && (row.platform === null || t.platforms.includes(row.platform))).length;
}

/**
 * One state row per rule when every platform carries the identical committed
 * set for it (by identity, not count); split per platform only on real
 * divergence. A rule gets rows when committed entries exist on any platform
 * OR this change moved it, so a rule banked down to zero keeps its row.
 * `platform: null` marks a collapsed row.
 */
type StateRow = { rule: string; platform: string | null; count: number };
function stateRows(report: Report): StateRow[] {
  const { results } = report;
  const ruleOrder: string[] = [];
  const add = (rule: string): void => {
    if (!ruleOrder.includes(rule)) {
      ruleOrder.push(rule);
    }
  };
  for (const result of results) {
    Object.keys(result.baselineCountByRule).forEach(add);
  }
  for (const tagged of [...report.grandfathered, ...report.banked]) {
    add(tagged.violation.rule.name);
  }

  return ruleOrder.flatMap((rule): StateRow[] => {
    const collapsible =
      results.length > 1 && results.every(r => r.baselineFingerprintByRule[rule] === results[0].baselineFingerprintByRule[rule]);
    if (collapsible) {
      return [{ rule, platform: null, count: results[0].baselineCountByRule[rule] ?? 0 }];
    }
    return results.map(r => ({ rule, platform: r.platform, count: r.baselineCountByRule[rule] ?? 0 }));
  });
}

function groupByRule(tagged: TaggedViolation[]): [string, TaggedViolation[]][] {
  const groups = new Map<string, TaggedViolation[]>();
  for (const entry of tagged) {
    const rule = entry.violation.rule.name;
    const group = groups.get(rule);
    if (group) {
      group.push(entry);
    } else {
      groups.set(rule, [entry]);
    }
  }
  return [...groups.entries()];
}
