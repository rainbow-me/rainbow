import { classifyPlatform } from './classify';
import { cycle, edge } from './test-fixtures';

describe('classifyPlatform', () => {
  const known = cycle(['a.ts', 'b.ts']);
  const fresh = cycle(['c.ts', 'd.ts']);

  it('treats baseline-matched occurrences as neither new nor stale, by identity', () => {
    const result = classifyPlatform('ios', [known], [cycle(['b.ts', 'a.ts']), fresh]);
    expect(result.newViolations).toEqual([fresh]);
    expect(result.staleEntries).toEqual([]);
  });

  it('marks baseline entries with no occurrence as stale', () => {
    const result = classifyPlatform('ios', [known], []);
    expect(result.staleEntries).toEqual([known]);
  });

  it('never lets a baseline entry neutralize a strict violation', () => {
    const strict = edge('node_modules/x/index.js', 'src/a.ts', 'no-dep-into-app-source');
    const result = classifyPlatform('ios', [strict], [strict]);
    expect(result.strictViolations).toEqual([strict]);
  });

  it('counts committed baseline entries per rule', () => {
    const result = classifyPlatform('ios', [known, fresh], []);
    expect(result.baselineCountByRule['no-circular']).toBe(2);
  });

  it('fingerprints the committed baseline set only, order-insensitively', () => {
    const other = cycle(['x.ts', 'y.ts']);
    const one = classifyPlatform('ios', [known, other], []);
    const two = classifyPlatform('android', [other, cycle(['b.ts', 'a.ts'])], [fresh]);
    expect(one.baselineFingerprintByRule['no-circular']).toBe(two.baselineFingerprintByRule['no-circular']);
  });
});
