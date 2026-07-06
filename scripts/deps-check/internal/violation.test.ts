import { cycle, edge } from './test-fixtures';
import { describeViolation, differenceByIdentity, tagByPlatform, violationKey, type Violation } from './violation';

describe('violationKey', () => {
  it('gives a cycle the same identity regardless of rotation or module order', () => {
    expect(violationKey(cycle(['a.ts', 'b.ts', 'c.ts']))).toBe(violationKey(cycle(['b.ts', 'c.ts', 'a.ts'])));
    expect(violationKey(cycle(['a.ts', 'b.ts', 'c.ts']))).toBe(violationKey(cycle(['c.ts', 'b.ts', 'a.ts'])));
  });

  it('separates cycles by rule and by module set', () => {
    expect(violationKey(cycle(['a.ts', 'b.ts']))).not.toBe(violationKey(cycle(['a.ts', 'b.ts'], 'other-rule')));
    expect(violationKey(cycle(['a.ts', 'b.ts']))).not.toBe(violationKey(cycle(['a.ts', 'c.ts'])));
  });

  it('keys plain edges by rule and direction', () => {
    expect(violationKey(edge('a.ts', 'b.ts', 'r'))).toBe(violationKey(edge('a.ts', 'b.ts', 'r')));
    expect(violationKey(edge('a.ts', 'b.ts', 'r'))).not.toBe(violationKey(edge('b.ts', 'a.ts', 'r')));
  });

  it('keys reachability violations by endpoints plus via set, order-insensitively', () => {
    const via = (names: string[]): Violation => ({ ...edge('a.ts', 'b.ts', 'r'), via: names.map(name => ({ name })) });
    expect(violationKey(via(['x.ts', 'y.ts']))).toBe(violationKey(via(['y.ts', 'x.ts'])));
    expect(violationKey(via(['x.ts']))).not.toBe(violationKey(via(['y.ts'])));
  });
});

describe('differenceByIdentity', () => {
  it('subtracts by identity, not by reference', () => {
    const kept = cycle(['a.ts', 'b.ts']);
    const gone = cycle(['c.ts', 'd.ts']);
    expect(differenceByIdentity([kept, gone], [cycle(['b.ts', 'a.ts'])])).toEqual([gone]);
  });
});

describe('tagByPlatform', () => {
  it('unions by identity across platform groups, recording where each violation occurs', () => {
    const tagged = tagByPlatform([
      { platform: 'ios', violations: [cycle(['a.ts', 'b.ts']), cycle(['c.ts', 'd.ts'])] },
      { platform: 'android', violations: [cycle(['b.ts', 'a.ts'])] },
    ]);
    expect(tagged).toHaveLength(2);
    expect(tagged[0].platforms).toEqual(['ios', 'android']);
    expect(tagged[1].platforms).toEqual(['ios']);
  });
});

describe('describeViolation', () => {
  it('renders a cycle as a closed loop', () => {
    expect(describeViolation(cycle(['a.ts', 'b.ts']))).toBe('a.ts → b.ts → a.ts');
  });

  it('renders a plain edge as from → to', () => {
    expect(describeViolation(edge('a.ts', 'b.ts', 'r'))).toBe('a.ts → b.ts');
  });
});
