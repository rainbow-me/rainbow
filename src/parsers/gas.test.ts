import { buildGasParams } from './gas';

jest.mock('@/handlers/web3', () => ({
  toHex: (value: string) => `0x${BigInt(value).toString(16)}`,
}));

describe('buildGasParams', () => {
  it('builds EIP-1559 transaction gas params from base and priority fees', () => {
    expect(
      buildGasParams({
        isEIP1559: true,
        maxBaseFee: '100',
        maxPriorityFee: '10',
      })
    ).toEqual({
      maxFeePerGas: '110',
      maxPriorityFeePerGas: '10',
    });
  });

  it('builds legacy transaction gas params from gas price', () => {
    expect(
      buildGasParams({
        gasPrice: '42',
        isEIP1559: false,
      })
    ).toEqual({ gasPrice: '42' });
  });
});
