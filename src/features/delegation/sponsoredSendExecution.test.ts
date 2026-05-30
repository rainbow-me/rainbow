import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { isNativeAsset } from '@/handlers/assets';
import { resolveNameOrAddress } from '@/handlers/web3';
import { ChainId } from '@/state/backendNetworks/types';

import { buildSendCallFromSendDetails } from './sponsoredSendExecution';

jest.mock('@/handlers/web3', () => ({
  resolveNameOrAddress: jest.fn(),
}));

jest.mock('@/handlers/assets', () => ({
  isNativeAsset: jest.fn(),
}));

jest.mock('./sponsoredSend', () => ({
  buildPendingSendTransaction: jest.fn(),
}));

jest.mock('./calls', () => ({
  isPreparedCallsExecutionSponsored: jest.fn(),
}));

jest.mock('@/logger', () => ({
  RainbowError: class RainbowError extends Error {},
}));

const mockIsNativeAsset = jest.mocked(isNativeAsset);
const mockResolveNameOrAddress = jest.mocked(resolveNameOrAddress);

const RECIPIENT = '0x4444444444444444444444444444444444444444' satisfies Address;

const ASSET = {
  address: '0x5555555555555555555555555555555555555555',
  decimals: 18,
  uniqueId: 'base-token',
} as ParsedAddressAsset;

describe('buildSendCallFromSendDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsNativeAsset.mockReturnValue(false);
    mockResolveNameOrAddress.mockResolvedValue(RECIPIENT);
  });

  it('builds ERC20 transfer calls from the exact decimal amount', async () => {
    const fullPrecisionAmount = '98765.432109876543210987';

    const call = await buildSendCallFromSendDetails({
      amount: fullPrecisionAmount,
      asset: ASSET,
      chainId: ChainId.base,
      toAddress: RECIPIENT,
    });

    expect(call).toEqual({
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [RECIPIENT, 98765432109876543210987n],
      }),
      to: ASSET.address,
      value: 0n,
    });
    expect(Number(fullPrecisionAmount).toString()).not.toBe(fullPrecisionAmount);
  });

  it('builds native transfer calls from the exact decimal amount', async () => {
    mockIsNativeAsset.mockReturnValue(true);

    await expect(
      buildSendCallFromSendDetails({
        amount: '1.5',
        asset: ASSET,
        chainId: ChainId.base,
        toAddress: RECIPIENT,
      })
    ).resolves.toEqual({
      data: '0x',
      to: RECIPIENT,
      value: 1500000000000000000n,
    });
  });

  it('rejects amounts that exceed the asset precision', async () => {
    await expect(
      buildSendCallFromSendDetails({
        amount: '0.9999999999999999999',
        asset: ASSET,
        chainId: ChainId.base,
        toAddress: RECIPIENT,
      })
    ).rejects.toThrow('[buildSendCallFromSendDetails]: invalid send amount');
  });
});
