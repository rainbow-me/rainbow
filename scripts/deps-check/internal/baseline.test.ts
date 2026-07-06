import { planUpdate } from './baseline';
import { cycle } from './test-fixtures';

describe('planUpdate', () => {
  const kept = cycle(['a.ts', 'b.ts']);
  const fixed = cycle(['c.ts', 'd.ts']);
  const fresh = cycle(['e.ts', 'f.ts']);

  it('always applies removals', () => {
    const plan = planUpdate([kept, fixed], [kept], false);
    expect(plan.written).toEqual([kept]);
    expect(plan.removed).toEqual([fixed]);
  });

  it('preserves kept entries verbatim from the old baseline', () => {
    const rotated = cycle(['b.ts', 'a.ts']);
    const plan = planUpdate([kept], [rotated], false);
    expect(plan.written[0]).toBe(kept);
  });

  it('leaves additions out without --allow-additions, but reports them', () => {
    const plan = planUpdate([kept], [kept, fresh], false);
    expect(plan.written).toEqual([kept]);
    expect(plan.additions).toEqual([fresh]);
  });

  it('writes the full current set with --allow-additions', () => {
    const plan = planUpdate([kept, fixed], [kept, fresh], true);
    expect(plan.written).toEqual([kept, fresh]);
    expect(plan.removed).toEqual([fixed]);
    expect(plan.additions).toEqual([fresh]);
  });
});
