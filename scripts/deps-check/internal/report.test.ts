import { classifyPlatform } from './classify';
import { buildReport } from './report';
import { cycle } from './test-fixtures';

describe('buildReport', () => {
  const shared = cycle(['a.ts', 'b.ts']);

  it('unions violations across platforms, tagging each with where it occurs', () => {
    const ios = classifyPlatform('ios', [], [shared]);
    const android = classifyPlatform('android', [], [cycle(['b.ts', 'a.ts'])]);
    const report = buildReport([ios, android], null);
    expect(report.newViolations).toHaveLength(1);
    expect(report.newViolations[0].platforms).toEqual(['ios', 'android']);
  });

  it('does not count a baseline removal as banked while the violation still occurs', () => {
    const ios = classifyPlatform('ios', [], [shared]);
    const report = buildReport([ios], { banked: [{ violation: shared, platforms: ['ios'] }], grandfathered: [] });
    expect(report.banked).toEqual([]);
    expect(report.failed).toBe(true);
  });

  it('fails on stale entries so fixes cannot merge unbanked', () => {
    const ios = classifyPlatform('ios', [shared], []);
    expect(buildReport([ios], null).failed).toBe(true);
  });

  it('passes when occurrences exactly match the baseline', () => {
    const ios = classifyPlatform('ios', [shared], [shared]);
    expect(buildReport([ios], null).failed).toBe(false);
  });
});
