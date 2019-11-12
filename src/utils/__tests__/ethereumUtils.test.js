import ethereumUtils from '../ethereumUtils';

const gasPrice = {
  txFee: {
    value: {
      amount: 21000,
    },
  },
};

it('getBalanceAmountEth', () => {
  const selected = {
    address: 'eth',
    balance: { amount: '1' },
  };
  const updatedBalance = ethereumUtils.getBalanceAmount(gasPrice, selected);
  expect(updatedBalance).toBe('0.999999999999979');
});

it('getBalanceAmountInsufficientEth', () => {
  const selected = {
    address: 'eth',
    balance: { amount: '0.00000000000000001' },
  };
  const updatedBalance = ethereumUtils.getBalanceAmount(gasPrice, selected);
  expect(updatedBalance).toBe('0');
});

it('getBalanceAmountToken', () => {
  const selected = {
    address: '0x12345',
    balance: { amount: '1' },
  };
  const updatedBalance = ethereumUtils.getBalanceAmount(gasPrice, selected);
  expect(updatedBalance).toBe('1');
});
