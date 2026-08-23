import { extractNationalDigits } from './phoneNumber';

describe('extractNationalDigits', () => {
  it('ignores input beyond a complete formatted number', () => {
    expect(extractNationalDigits('(123) 456-78905')).toBe('1234567890');
  });

  it.each(['+1 (212) 555-0100', '1 (212) 555-0100'])('removes the country calling code from %s', text => {
    expect(extractNationalDigits(text)).toBe('2125550100');
  });
});
