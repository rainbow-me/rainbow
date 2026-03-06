import { formatTokenDisplayValue } from '@/screens/rewards/helpers/formatTokenDisplayValue';

const TOKEN_SYMBOL = 'OP';

describe('formatting values without decimal part', () => {
  test('formatting display value for small token value without decimal part', () => {
    expect(formatTokenDisplayValue(420, TOKEN_SYMBOL)).toEqual('420 OP');
  });

  test('formatting display value for larger token value without decimal part', () => {
    expect(formatTokenDisplayValue(420000, TOKEN_SYMBOL)).toEqual('420,000 OP');
  });

  test('formatting display value for very large token value without decimal part', () => {
    expect(formatTokenDisplayValue(420000000, TOKEN_SYMBOL)).toEqual('420,000,000 OP');
  });
});

describe('formatting values with single digit decimal part', () => {
  test('formatting display value for small token value with single digit decimal part', () => {
    expect(formatTokenDisplayValue(420.1, TOKEN_SYMBOL)).toEqual('420.1 OP');
  });

  test('formatting display value for larger token value with single digit decimal part', () => {
    expect(formatTokenDisplayValue(420000.1, TOKEN_SYMBOL)).toEqual('420,000.1 OP');
  });

  test('formatting display value for very large token value with single digit decimal part', () => {
    expect(formatTokenDisplayValue(420000000.1, TOKEN_SYMBOL)).toEqual('420,000,000.1 OP');
  });
});

describe('formatting values with double digit decimal part', () => {
  test('formatting display value for small token value with double digit decimal part', () => {
    expect(formatTokenDisplayValue(420.12, TOKEN_SYMBOL)).toEqual('420.12 OP');
  });

  test('formatting display value for larger token value with double digit decimal part', () => {
    expect(formatTokenDisplayValue(420000.12, TOKEN_SYMBOL)).toEqual('420,000.12 OP');
  });

  test('formatting display value for very large token value with double digit decimal part', () => {
    expect(formatTokenDisplayValue(420000000.12, TOKEN_SYMBOL)).toEqual('420,000,000.12 OP');
  });
});

describe('formatting values with triple digit decimal part', () => {
  test('formatting display value for small token value with triple digit decimal part', () => {
    expect(formatTokenDisplayValue(420.123, TOKEN_SYMBOL)).toEqual('420.12 OP');
  });

  test('formatting display value for larger token value with triple digit decimal part', () => {
    expect(formatTokenDisplayValue(420000.123, TOKEN_SYMBOL)).toEqual('420,000.12 OP');
  });

  test('formatting display value for very large token value with triple digit decimal part', () => {
    expect(formatTokenDisplayValue(420000000.123, TOKEN_SYMBOL)).toEqual('420,000,000.12 OP');
  });
});
