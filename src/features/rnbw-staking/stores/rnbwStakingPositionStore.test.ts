import { Interface } from '@ethersproject/abi';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

import { getProvider } from '@/handlers/web3';
import { logger } from '@/logger';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { useStakingPositionStore } from './rnbwStakingPositionStore';

// Exercise the fetcher without starting the store's subscriptions or retry timers.
jest.mock('@storesjs/stores', () => ({
  createQueryStore: ({ fetcher }: { fetcher: (params: unknown) => Promise<unknown> }) => ({
    getState: () => ({ fetch: fetcher }),
  }),
}));
jest.mock('@/features/rnbw-membership/stores/rnbwMembershipAnalyticsStore', () => ({}));
jest.mock('@/state/assets/userAssetsStoreManager', () => ({}));
jest.mock('@/state/wallets/walletsStore', () => ({}));
jest.mock('@/helpers/utilities', () => ({ convertRawAmountToDecimalFormat: () => '1' }));
jest.mock('@/handlers/web3', () => ({ getProvider: jest.fn() }));
jest.mock('@/resources/platform/client', () => ({
  getPlatformClient: () => ({ get: jest.fn().mockResolvedValue({ data: { result: { hasPosition: true } } }) }),
}));

const PARAMS = { address: '0x3333333333333333333333333333333333333333', currency: 'USD' } as const;
const ABI = new Interface(STAKING_ABI);

let provider: StaticJsonRpcProvider;

beforeEach(() => {
  provider = new StaticJsonRpcProvider(undefined, STAKING_CHAIN_ID);
  jest.mocked(getProvider).mockReturnValue(provider);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

it('reads an ethers response using viem calldata and decoding', async () => {
  const send = jest.spyOn(provider, 'send').mockResolvedValue(ABI.encodeFunctionResult('exitFeeBps', [500]));

  await expect(useStakingPositionStore.getState().fetch(PARAMS)).resolves.toEqual({ hasPosition: true, exitFeePercentage: 5 });
  expect(send).toHaveBeenCalledWith('eth_call', [
    { to: STAKING_CONTRACT_ADDRESS.toLowerCase(), data: ABI.encodeFunctionData('exitFeeBps') },
    'latest',
  ]);
  expect(logger.error).not.toHaveBeenCalled();
});

it.each([
  { code: 'TIMEOUT', reason: 'timeout' },
  { code: 'SERVER_ERROR', reason: 'missing response' },
])('preserves $reason failures for retries without reporting a contract error', async details => {
  const rpcError = Object.assign(new Error(details.reason), details);
  jest.spyOn(provider, 'send').mockRejectedValue(rpcError);

  await expect(useStakingPositionStore.getState().fetch(PARAMS)).rejects.toMatchObject({ code: 'CALL_EXCEPTION', error: rpcError });
  expect(logger.error).not.toHaveBeenCalled();
});

it.each([
  { code: -32000, reason: 'execution reverted' },
  { code: 'SERVER_ERROR', reason: 'processing response error' },
  { code: 'SERVER_ERROR', reason: 'bad response', status: 401 },
])('still reports RPC failures with reason $reason', async details => {
  const rpcError = Object.assign(new Error(details.reason), details);
  jest.spyOn(provider, 'send').mockRejectedValue(rpcError);

  await expect(useStakingPositionStore.getState().fetch(PARAMS)).rejects.toMatchObject({ code: 'CALL_EXCEPTION', error: rpcError });
  expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ cause: expect.objectContaining({ error: rpcError }) }));
});

it('still reports empty contract results instead of using a fallback fee', async () => {
  jest.spyOn(provider, 'send').mockResolvedValue('0x');

  await expect(useStakingPositionStore.getState().fetch(PARAMS)).rejects.toThrow();
  expect(logger.error).toHaveBeenCalledTimes(1);
});
