import { policyFor } from '../../policies';
import type { Report } from '../report';
import type { TaggedViolation } from '../violation';
import { violationEntry } from './entry';

/** Stale-entry ("Fixed:") listings are capped per rule; rendered cycle chains can run to kilobytes each. */
const STALE_LIST_CAP = 10;

/** Zone 1: this change's pending occurrences — everything that still needs action. */
export const pending = {
  terminal(report: Report): string {
    const entryLine = (tagged: TaggedViolation): string => violationEntry.terminal(tagged, report.results.length);

    const sections = ruleActivities(report).map(activity => {
      const { label, hint } = policyFor(activity.rule);

      if (activity.strictEntries.length > 0) {
        const count = activity.strictEntries.length;
        return [
          `✖ ${label}${label === activity.rule ? '' : ` (${activity.rule})`}: ${count} violation${count === 1 ? '' : 's'} — FORBIDDEN`,
          ...activity.strictEntries.map(entryLine),
          hint && `  ${hint}`,
        ]
          .filter(Boolean)
          .join('\n');
      }

      const hasNew = activity.newEntries.length > 0;
      const headline = [
        hasNew && `${activity.newEntries.length} new — FORBIDDEN`,
        activity.staleEntries.length > 0 && `${activity.staleEntries.length} fixed${hasNew ? ' 🎉' : '!'}`,
      ]
        .filter(Boolean)
        .join(', ');
      const staleOverflow = activity.staleEntries.length - STALE_LIST_CAP;
      return [
        `${hasNew ? '✖' : '🎉'} ${label}: ${headline}`,
        hasNew && activity.staleEntries.length > 0 && `  New:`,
        ...activity.newEntries.map(entryLine),
        hasNew && activity.staleEntries.length > 0 && `  Fixed:`,
        ...activity.staleEntries.slice(0, STALE_LIST_CAP).map(entryLine),
        staleOverflow > 0 && `    … and ${staleOverflow} more (the full list appears in the baseline diff after ratcheting)`,
        hasNew && hint && `  ${hint}`,
        hasNew && `  If genuinely unavoidable, grandfather it:`,
        hasNew && `    yarn lint:deps:baseline:update --allow-additions`,
      ]
        .filter(Boolean)
        .join('\n');
    });

    const ratchetFooter = report.stale.length > 0 && [`🥳 Bank the win! Run and commit:`, `  yarn lint:deps:baseline:update`].join('\n');

    const allClear = sections.length === 0 && '✔ No new dependency violations.';

    return [...sections, ratchetFooter, allClear].filter(Boolean).join('\n\n');
  },

  markdown(report: Report): string {
    const entryItem = (tagged: TaggedViolation): string => violationEntry.markdown(tagged, report.results.length);

    const sections = ruleActivities(report).map(activity => {
      const { label, hint } = policyFor(activity.rule);

      if (activity.strictEntries.length > 0) {
        const count = activity.strictEntries.length;
        return [
          `### ✖ ${label}${label === activity.rule ? '' : ` (\`${activity.rule}\`)`} — ${count} violation${count === 1 ? '' : 's'} (FORBIDDEN)`,
          activity.strictEntries.map(entryItem).join('\n'),
          hint,
        ]
          .filter(Boolean)
          .join('\n\n');
      }

      const hasNew = activity.newEntries.length > 0;
      const hasStale = activity.staleEntries.length > 0;
      const mixed = hasNew && hasStale;
      const headline = [
        hasNew && `${activity.newEntries.length} new (FORBIDDEN)`,
        hasStale && `${activity.staleEntries.length} fixed${mixed ? ' 🎉' : '!'}`,
      ]
        .filter(Boolean)
        .join(', ');
      const staleOverflow = activity.staleEntries.length - STALE_LIST_CAP;
      return [
        `### ${hasNew ? '✖' : '🎉'} ${label} — ${headline}`,
        mixed && `**New:**`,
        hasNew && activity.newEntries.map(entryItem).join('\n'),
        hasNew && hint && `${hint} If genuinely unavoidable: \`yarn lint:deps:baseline:update --allow-additions\`.`,
        mixed && `**Fixed:**`,
        hasStale &&
          [
            ...activity.staleEntries.slice(0, STALE_LIST_CAP).map(entryItem),
            staleOverflow > 0 && `- … and ${staleOverflow} more (the full list appears in the baseline diff after ratcheting)`,
          ]
            .filter(Boolean)
            .join('\n'),
      ]
        .filter(Boolean)
        .join('\n\n');
    });

    const ratchetFooter =
      report.stale.length > 0 &&
      [
        '**🥳 Bank the win** (the check stays red until the baseline matches): run and commit',
        '```',
        'yarn lint:deps:baseline:update',
        '```',
      ].join('\n');

    return [...sections, ratchetFooter].filter(Boolean).join('\n\n');
  },
};

type RuleActivity = { rule: string; strictEntries: TaggedViolation[]; newEntries: TaggedViolation[]; staleEntries: TaggedViolation[] };

/** Per-rule grouping in presentation order: strict rules, then new, then fixed-only. */
function ruleActivities({ strictViolations, newViolations, stale }: Report): RuleActivity[] {
  const byRule = new Map<string, RuleActivity>();
  const activityFor = (rule: string): RuleActivity => {
    let activity = byRule.get(rule);
    if (!activity) {
      activity = { rule, strictEntries: [], newEntries: [], staleEntries: [] };
      byRule.set(rule, activity);
    }
    return activity;
  };
  for (const tagged of strictViolations) {
    activityFor(tagged.violation.rule.name).strictEntries.push(tagged);
  }
  for (const tagged of newViolations) {
    activityFor(tagged.violation.rule.name).newEntries.push(tagged);
  }
  for (const tagged of stale) {
    activityFor(tagged.violation.rule.name).staleEntries.push(tagged);
  }
  return [...byRule.values()];
}
