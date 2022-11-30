import { getFormattedEthFee } from '@/screens/transaction-details/helpers/getFormattedEthFee';

describe('getFormattedEthFee transaction details sheet helper', () => {
  test('displays correct format for fees higher than 0.0001 ETH', () => {
    expect(getFormattedEthFee(6912340000000000)).toEqual('0.006912 Eth');
    expect(getFormattedEthFee(1694212312300000000)).toEqual('1.694212 Eth');
    expect(getFormattedEthFee(100000000000000)).toEqual('0.0001 Eth');
    expect(getFormattedEthFee(120000000000000)).toEqual('0.00012 Eth');
  });

  test('displays correct format for fees lower than 0.0001 ETH and higher than 0.0001 Gwei', () => {
    expect(getFormattedEthFee(100000)).toEqual('0.0001 Gwei');
    expect(getFormattedEthFee(123000)).toEqual('0.000123 Gwei');
    expect(getFormattedEthFee(69123000)).toEqual('0.069123 Gwei');
    expect(getFormattedEthFee(69420694200000)).toEqual('69420.69 Gwei');
    expect(getFormattedEthFee(420691230000)).toEqual('420.69 Gwei');
  });

  test('displays correct format for fees lower than 0.0001 Gwei', () => {
    expect(getFormattedEthFee(99000)).toEqual('99000 Wei');
    expect(getFormattedEthFee(42069)).toEqual('42069 Wei');
    expect(getFormattedEthFee(1)).toEqual('1 Wei');
    expect(getFormattedEthFee(0)).toEqual('0 Wei');
  });
});
