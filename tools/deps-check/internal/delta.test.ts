import { baselineDelta } from './delta';
import { cycle } from './test-fixtures';

describe('baselineDelta', () => {
  const stays = cycle(['a.ts', 'b.ts']);
  const removed = cycle(['c.ts', 'd.ts']);
  const added = cycle(['e.ts', 'f.ts']);

  it('classifies removals as banked and additions as grandfathered', () => {
    const delta = baselineDelta([{ platform: 'ios', base: [stays, removed], head: [stays, added] }]);
    expect(delta.banked.map(t => t.violation)).toEqual([removed]);
    expect(delta.grandfathered.map(t => t.violation)).toEqual([added]);
  });

  it('unions movement across platforms with platform tags', () => {
    const delta = baselineDelta([
      { platform: 'ios', base: [stays, removed], head: [stays] },
      { platform: 'android', base: [stays, removed], head: [stays, removed] },
    ]);
    expect(delta.banked).toHaveLength(1);
    expect(delta.banked[0].platforms).toEqual(['ios']);
  });

  it('matches by identity, so a rotated cycle is no movement at all', () => {
    const delta = baselineDelta([{ platform: 'ios', base: [stays], head: [cycle(['b.ts', 'a.ts'])] }]);
    expect(delta.banked).toEqual([]);
    expect(delta.grandfathered).toEqual([]);
  });
});
