import { extractNationalDigits } from './phoneNumber';

describe('extractNationalDigits', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['(212) 5', '2125'],
    ['(1) 555-0100', '15550100'],
    ['(212) 555-0100', '2125550100'],
    ['+1 212', '212'],
  ])('preserves national digits in %s', (text, expected) => {
    expect(extractNationalDigits(text)).toBe(expected);
  });

  it.each(['+1 (212) 555-0100', '+ 1 (212) 555-0100', '1 (212) 555-0100', '(1) 212-555-0100', '(+1) 212-555-0100', '12125550100'])(
    'removes the country calling code from %s',
    text => {
      expect(extractNationalDigits(text)).toBe('2125550100');
    }
  );

  it.each(['(123) 456-78905', '(212) 555-00100', '212555010099', '+1 212555010099', '+44 20 7946 0958', '(212) 555-0100 ext. 99'])(
    'rejects %s without truncating it',
    text => {
      expect(extractNationalDigits(text)).toBeNull();
    }
  );
});
