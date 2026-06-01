import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { buildTransferTransaction } from '@/handlers/web3';
import { ChainId } from '@/state/backendNetworks/types';

import { buildSendCall } from './sponsoredSend';
import { buildSendCallFromSendDetails } from './sponsoredSendExecution';

jest.mock('@/handlers/web3', () => ({
  buildTransferTransaction: jest.fn(),
}));

jest.mock('./sponsoredSend', () => ({
  buildPendingSendTransaction: jest.fn(),
  buildSendCall: jest.fn(),
  prepareSponsoredSend: jest.fn(),
}));

jest.mock('./calls', () => ({
  isPreparedCallsExecutionSponsored: jest.fn(),
}));

jest.mock('@/logger', () => ({
  ensureError: (error: unknown) => error,
  logger: { warn: jest.fn() },
}));

const mockBuildTransferTransaction = jest.mocked(buildTransferTransaction);
const mockBuildSendCall = jest.mocked(buildSendCall);

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const RECIPIENT = '0x4444444444444444444444444444444444444444' satisfies Address;

const ASSET = {
  address: '0x5555555555555555555555555555555555555555',
  decimals: 18,
  uniqueId: 'base-token',
} as ParsedAddressAsset;

const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', ChainId.base);

describe('buildSendCallFromSendDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildTransferTransaction.mockResolvedValue({ data: '0x', to: RECIPIENT, value: '0' });
    mockBuildSendCall.mockReturnValue({ data: '0x', to: RECIPIENT, value: 0n });
  });

  // Regression for APP-3768: a full-balance max send must reach buildTransferTransaction as the exact
  // decimal string. Coercing through Number() drops precision on 18-decimal balances and can push
  // the raw amount above the onchain balance ("ERC20: transfer amount exceeds balance").
  it('forwards the full-precision amount string to buildTransferTransaction without Number() coercion', async () => {
    const fullPrecisionAmount = '98765.432109876543210987';

    await buildSendCallFromSendDetails({
      accountAddress: ACCOUNT,
      amount: fullPrecisionAmount,
      asset: ASSET,
      chainId: ChainId.base,
      provider,
      toAddress: RECIPIENT,
    });

    expect(mockBuildTransferTransaction).toHaveBeenCalledWith(
      { address: ACCOUNT, amount: fullPrecisionAmount, asset: ASSET, recipient: RECIPIENT },
      provider,
      ChainId.base
    );

    const passedAmount = mockBuildTransferTransaction.mock.calls[0][0].amount;
    expect(typeof passedAmount).toBe('string');
    expect(passedAmount).toBe(fullPrecisionAmount);
    expect(Number(passedAmount).toString()).not.toBe(passedAmount);
  });
});
