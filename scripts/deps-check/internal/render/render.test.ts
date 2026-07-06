import type { Report } from '../report';
import { check, cycle, edge } from '../test-fixtures';
import type { Violation } from '../violation';
import { renderAnnotations } from './annotations';
import { renderMarkdown } from './markdown';
import { renderTerminal } from './terminal';

// One representative case per output-shape equivalence class; snapshots pin
// the exact surface text so copy and structure changes are always reviewed.

function snap(report: Report): void {
  expect(renderTerminal(report)).toMatchSnapshot('terminal');
  expect(renderMarkdown(report)).toMatchSnapshot('markdown');
}

const baselined = [cycle(['src/a.ts', 'src/b.ts']), cycle(['src/c.ts', 'src/d.ts', 'src/e.ts'])];
const fresh = cycle(['src/new1.ts', 'src/new2.ts']);
const strictEdge = edge('node_modules/evil/index.js', 'src/state/wallets.ts', 'no-dep-into-app-source');
function onBothPlatforms(violations: Violation[]): Record<string, Violation[]> {
  return { ios: violations, android: violations };
}

describe('clean report', () => {
  it('renders the all-clear line and a bare-count table', () => {
    snap(check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms(baselined) }));
  });
});

describe('pending zone', () => {
  it('renders new violations as a FORBIDDEN section with the hint and the grandfather escape', () => {
    snap(check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms([...baselined, fresh]) }));
  });

  it('celebrates fixed violations and closes with the bank-the-win footer', () => {
    snap(check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms([baselined[0]]) }));
  });

  it('merges new and fixed into one section with labeled sub-lists', () => {
    snap(check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms([baselined[0], fresh]) }));
  });

  it('renders strict violations as FORBIDDEN without baseline affordances', () => {
    snap(check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms([...baselined, strictEdge]) }));
  });

  it('treats rules without a policy entry as strict, labeled by their bare rule name', () => {
    const unknown = edge('src/x.ts', 'src/y.ts', 'some-future-rule');
    snap(check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms([...baselined, unknown]) }));
  });

  it('qualifies entries that are missing from some platforms', () => {
    snap(check({ committed: onBothPlatforms(baselined), occurring: { ios: [...baselined, fresh], android: baselined } }));
  });

  it('caps fixed listings and counts the overflow', () => {
    const many = Array.from({ length: 12 }, (_, i) => cycle([`src/m${i}.ts`, `src/n${i}.ts`]));
    snap(check({ committed: onBothPlatforms(many), occurring: onBothPlatforms([]) }));
  });
});

describe('baseline state zone', () => {
  it('shows grandfathered movement as a cell arrow plus a receipt requiring confirmation', () => {
    const grown = [...baselined, fresh];
    snap(check({ committed: onBothPlatforms(grown), occurring: onBothPlatforms(grown), baseCommitted: onBothPlatforms(baselined) }));
  });

  it('shows banked movement as a cell arrow plus a celebration receipt', () => {
    const shrunk = [baselined[0]];
    snap(check({ committed: onBothPlatforms(shrunk), occurring: onBothPlatforms(shrunk), baseCommitted: onBothPlatforms(baselined) }));
  });

  it('fits opposite movements into one cell and stacks their receipts, warning first', () => {
    const swapped = [baselined[0], fresh];
    snap(check({ committed: onBothPlatforms(swapped), occurring: onBothPlatforms(swapped), baseCommitted: onBothPlatforms(baselined) }));
  });

  it('renders an unreadable base ref identically to no movement', () => {
    const untouched = { committed: onBothPlatforms(baselined), occurring: onBothPlatforms(baselined) };
    expect(renderMarkdown(check({ ...untouched, baseCommitted: null }))).toBe(renderMarkdown(check(untouched)));
    expect(renderTerminal(check({ ...untouched, baseCommitted: null }))).toBe(renderTerminal(check(untouched)));
  });

  it('splits rows when committed baselines diverge, scoping movement per platform', () => {
    const grown = [...baselined, fresh];
    snap(
      check({
        committed: { ios: grown, android: baselined },
        occurring: { ios: grown, android: baselined },
        baseCommitted: onBothPlatforms(baselined),
      })
    );
  });

  it('labels rows with the platform on single-platform runs', () => {
    snap(check({ committed: { ios: baselined }, occurring: { ios: baselined } }));
  });

  it('keeps the rule row when a baseline is banked down to zero', () => {
    snap(check({ committed: onBothPlatforms([]), occurring: onBothPlatforms([]), baseCommitted: onBothPlatforms(baselined) }));
  });
});

describe('annotations', () => {
  it('annotates new and strict violations, not fixed ones', () => {
    const report = check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms([baselined[0], fresh, strictEdge]) });
    expect(renderAnnotations(report)).toMatchSnapshot();
  });

  it('escapes workflow-command metacharacters in the message', () => {
    const weird = cycle(['src/100%.ts', 'src/b.ts']);
    const report = check({ committed: onBothPlatforms(baselined), occurring: onBothPlatforms([...baselined, weird]) });
    expect(renderAnnotations(report)[0]).toContain('src/100%25.ts → src/b.ts');
  });
});

describe('everything at once', () => {
  it('orders strict and pending sections first with their remedies, the baseline ledger last', () => {
    const grandfathered = cycle(['src/g1.ts', 'src/g2.ts']);
    snap(
      check({
        committed: onBothPlatforms([baselined[0], grandfathered]),
        occurring: onBothPlatforms([grandfathered, fresh, strictEdge]),
        baseCommitted: onBothPlatforms(baselined),
      })
    );
  });
});
