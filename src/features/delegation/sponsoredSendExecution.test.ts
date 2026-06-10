import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { isNativeAsset } from '@/handlers/assets';
import { resolveNameOrAddress } from '@/handlers/web3';
import { ChainId } from '@/state/backendNetworks/types';

import { buildSendCallFromSendDetails } from './sponsoredSendExecution';

jest.mock('@/handlers/assets', () => ({
  isNativeAsset: jest.fn(),
}));

jest.mock('@/handlers/web3', () => ({
  resolveNameOrAddress: jest.fn(),
}));

jest.mock('./sponsoredSend', () => ({
  buildPendingSendTransaction: jest.fn(),
}));

const RECIPIENT = '0x4444444444444444444444444444444444444444' satisfies Address;
const TOKEN_ADDRESS = '0x5555555555555555555555555555555555555555' satisfies Address;

const nativeAsset = {
  address: '0x0000000000000000000000000000000000000000',
  chainId: ChainId.base,
  decimals: 18,
  name: 'Ether',
  network: 'base',
  symbol: 'ETH',
  uniqueId: 'base-eth',
} satisfies ParsedAddressAsset;

const tokenAsset = {
  address: TOKEN_ADDRESS,
  chainId: ChainId.base,
  decimals: 18,
  name: 'Token',
  network: 'base',
  symbol: 'TKN',
  uniqueId: 'base-token',
} satisfies ParsedAddressAsset;

const mockIsNativeAsset = jest.mocked(isNativeAsset);
const mockResolveNameOrAddress = jest.mocked(resolveNameOrAddress);

describe('sponsoredSendExecution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveNameOrAddress.mockImplementation(async address => address);
  });

  it('builds native calls from exact raw units', async () => {
    mockIsNativeAsset.mockReturnValue(true);

    await expect(
      buildSendCallFromSendDetails({
        amount: '0.999999999999999999',
        asset: nativeAsset,
        chainId: ChainId.base,
        toAddress: RECIPIENT,
      })
    ).resolves.toEqual({
      data: '0x',
      to: RECIPIENT,
      value: 999999999999999999n,
    });
  });

  it('builds token calls from exact raw units', async () => {
    mockIsNativeAsset.mockReturnValue(false);

    await expect(
      buildSendCallFromSendDetails({
        amount: '1.234567891234567891',
        asset: tokenAsset,
        chainId: ChainId.base,
        toAddress: RECIPIENT,
      })
    ).resolves.toEqual({
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [RECIPIENT, 1234567891234567891n],
      }),
      to: TOKEN_ADDRESS,
      value: 0n,
    });
  });
});
