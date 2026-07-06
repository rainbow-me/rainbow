import { policyFor, unknownPolicyRules } from './policies';

describe('policyFor', () => {
  it('returns the declared policy for known rules', () => {
    expect(policyFor('no-circular').mode).toBe('baseline');
  });

  it('defaults unknown rules to strict, labeled by their bare rule name', () => {
    expect(policyFor('some-future-rule')).toEqual({ mode: 'strict', label: 'some-future-rule' });
  });
});

describe('unknownPolicyRules', () => {
  it('reports policy entries that name no existing rule', () => {
    expect(unknownPolicyRules(new Set(['no-circular']))).toEqual(['no-dep-into-app-source']);
    expect(unknownPolicyRules(new Set(['no-circular', 'no-dep-into-app-source']))).toEqual([]);
  });
});
