import { type SafeTransaction } from '@polymarket/builder-relayer-client';
import { Chain, ClobClient, Side } from '@polymarket/clob-client-v2';
import { decodeFunctionData, erc20Abi, erc1155Abi, maxUint256, parseAbi, toHex } from 'viem';
import { afterEach, expect, it, vi } from 'vitest';

import '../../../../config/test/storeEnvironment';

import {
  POLYMARKET_CTF_ADDRESS,
  POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS,
  POLYMARKET_EXCHANGE_V3,
  POLYMARKET_POSITION_MANAGER,
  POLYMARKET_PUSD_ADDRESS,
  POLYMARKET_ROUTER,
} from '../constants';
import { getPolymarketWallet } from '../stores/derived/usePolymarketClients';
import { redeemPosition } from './redeemPosition';
import { ensureTradingApprovals } from './tradingApprovals';

const call = vi.hoisted(() => vi.fn());
const wallet = '0x0000000000000000000000000000000000000001';
const executeBatch = vi
  .fn<(transactions: SafeTransaction[], description: string) => Promise<{ wait: () => Promise<{ state: string }> }>>()
  .mockResolvedValue({ wait: async () => ({ state: 'STATE_CONFIRMED' }) });
const orderWallet = { address: wallet, execute: vi.fn() } as const;
const asset = '257'; // bytes31 condition 1, outcome 1
const position = {
  asset,
  proxyWallet: wallet,
  conditionId: toHex(42, { size: 32 }),
  size: 11.7727,
  market: { version: 'v2', clobTokenIds: ['256', asset] },
  negativeRisk: false,
  currentValue: 11.7727,
  slug: 'market',
  eventSlug: 'event',
  outcome: 'No',
} satisfies Parameters<typeof redeemPosition>[0];

vi.mock('@/analytics', () => ({ analytics: { track: vi.fn(), event: {} } }));
vi.mock('@/handlers/web3', () => ({ getProvider: () => ({ call }) }));
vi.mock('../stores/derived/usePolymarketClients', () => ({
  getPolymarketWallet: vi.fn(async () => ({ address: wallet, execute: executeBatch })),
}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('redeems exact on-chain units through Router, including shares rounded out of the portfolio', async () => {
  call.mockImplementation(async ({ to, data }) => {
    if (to !== POLYMARKET_POSITION_MANAGER) throw new Error('Wrong ledger');
    const { functionName, args } = decodeFunctionData({ abi: erc1155Abi, data });
    if (functionName === 'balanceOf' && args[0] === wallet && args[1] === 257n) return toHex(11772728n, { size: 32 });
    if (functionName === 'isApprovedForAll' && args[1] === POLYMARKET_ROUTER) return toHex(0, { size: 32 });
    throw new Error('Wrong position read');
  });
  await redeemPosition(position);
  expect(getPolymarketWallet).toHaveBeenCalledWith(position.proxyWallet);
  const [approval, redeem] = executeBatch.mock.calls[0][0];
  expect(approval.to).toBe(POLYMARKET_POSITION_MANAGER);
  expect(decodeFunctionData({ abi: erc1155Abi, data: approval.data as `0x${string}` })).toMatchObject({
    functionName: 'setApprovalForAll',
    args: [POLYMARKET_ROUTER, true],
  });
  expect(redeem.to).toBe(POLYMARKET_ROUTER);
  expect(
    decodeFunctionData({ abi: parseAbi(['function redeem(bytes31,uint256,uint256)']), data: redeem.data as `0x${string}` }).args
  ).toEqual([toHex(1, { size: 31 }), 1n, 11772728n]);
});

it('redeems a retained CTF token using its original condition after its market changes IDs', async () => {
  const fetch = vi.spyOn(global, 'fetch').mockResolvedValue(Response.json({ data: [{ token_id: '123', module: 'v1_ctf' }] }));
  call.mockResolvedValue(toHex(1, { size: 32 }));
  await redeemPosition({ ...position, asset: '123' });
  expect(String(fetch.mock.calls[0][0])).toContain('/v2/tokens?token_id=123');
  expect(call.mock.calls[0][0].to).toBe(POLYMARKET_CTF_ADDRESS);
  const [redeem] = executeBatch.mock.calls[0][0];
  expect(redeem.to).toBe(POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS);
  expect(
    decodeFunctionData({
      abi: parseAbi(['function redeemPositions(address,bytes32,bytes32,uint256[])']),
      data: redeem.data as `0x${string}`,
    }).args[2]
  ).toBe(position.conditionId);
});

it.each([Side.BUY, Side.SELL])('grants only the V2 approval needed to %s', async side => {
  call.mockResolvedValue(toHex(0, { size: 32 }));
  const client = new ClobClient({ host: 'https://clob.test', chain: Chain.POLYGON });
  vi.spyOn(client, 'updateBalanceAllowance').mockResolvedValue();
  orderWallet.execute.mockImplementation(executeBatch);
  await ensureTradingApprovals(client, orderWallet, 'v2', side);
  const batch = executeBatch.mock.calls[0][0];
  expect(batch).toHaveLength(1);
  const [{ to, data }] = batch;
  const buy = side === Side.BUY;
  expect(to).toBe(buy ? POLYMARKET_PUSD_ADDRESS : POLYMARKET_POSITION_MANAGER);
  expect(decodeFunctionData({ abi: buy ? erc20Abi : erc1155Abi, data: data as `0x${string}` })).toMatchObject({
    functionName: buy ? 'approve' : 'setApprovalForAll',
    args: [POLYMARKET_EXCHANGE_V3, buy ? maxUint256 : true],
  });
});
