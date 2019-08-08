import { getBalanceAmount } from '../ethereumUtils';

const gasPrice = {
  txFee: {
    value: {
      amount: 21000,
    }
  }
};

test('getBalanceAmountEth', () => {
  const selected = {
    address: 'eth',
    balance: { amount: '1' },
  };
  const updatedBalance = getBalanceAmount(gasPrice, selected);
  expect(updatedBalance).toBe('0.999999999999979');
});

test('getBalanceAmountInsufficientEth', () => {
  const selected = {
    address: 'eth',
    balance: { amount: '0.00000000000000001' },
  };
  const updatedBalance = getBalanceAmount(gasPrice, selected);
  expect(updatedBalance).toBe('0');
});

test('getBalanceAmountToken', () => {
  const selected = {
    address: '0x12345',
    balance: { amount: '1' },
  };
  const updatedBalance = getBalanceAmount(gasPrice, selected);
  expect(updatedBalance).toBe('1');
});

