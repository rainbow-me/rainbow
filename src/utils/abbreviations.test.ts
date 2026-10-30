import { describe, expect, it } from 'vitest';

import { abbreviateEnsForDisplay } from './abbreviations';

describe('abbreviateEnsForDisplay', () => {
  it('returns short names unchanged', () => {
    expect(abbreviateEnsForDisplay('rainbow.eth')).toBe('rainbow.eth');
    expect(abbreviateEnsForDisplay('rainbow.base.eth')).toBe('rainbow.base.eth');
  });

  it('returns non-domain text unchanged', () => {
    expect(abbreviateEnsForDisplay(undefined)).toBeUndefined();
    expect(abbreviateEnsForDisplay('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('truncates a long label and keeps the top-level domain', () => {
    expect(abbreviateEnsForDisplay('averyveryverylongensname.eth')).toBe('averyveryverylon...name.eth');
  });

  it('keeps every parent label of a subname', () => {
    expect(abbreviateEnsForDisplay('averyveryverylongensname.base.eth')).toBe('averyveryverylon...name.base.eth');
    expect(abbreviateEnsForDisplay('averyveryverylongensname.wallet.rainbow.eth', 8, 4)).toBe('aver...name.wallet.rainbow.eth');
  });
});
