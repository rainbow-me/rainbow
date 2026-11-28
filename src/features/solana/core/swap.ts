import { formatUnits, parseUnits } from 'viem';

import { ChainId } from '@/features/network/types/backendNetworks';
import { BONK, SOL, SOLANA_USDC, solanaToken } from '@/features/solana/core/mvpRoutes';
import { type PreparedRouteExecution } from '@rainbow-me/solana-sdk';

export const SWAP_ASSETS = {
  'base-eth': {
    id: 'base-eth',
    chain: 'evm',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Base',
    decimals: 18,
    asset: { location: 'evm', kind: 'native', chainId: ChainId.base },
  },
  'sol': { id: 'sol', isVerified: true, chain: 'solana', name: 'Solana', symbol: 'SOL', network: 'Solana', decimals: 9, asset: SOL },
  'usdc': {
    id: 'usdc',
    isVerified: true,
    chain: 'solana',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Solana',
    decimals: 6,
    asset: solanaToken(SOLANA_USDC),
  },
  'bonk': { id: 'bonk', chain: 'solana', name: 'Bonk', symbol: 'BONK', network: 'Solana', decimals: 5, asset: solanaToken(BONK) },
} as const;
export type SolanaSwapAsset = {
  id: string;
  chain: 'solana';
  name: string;
  symbol: string;
  network: 'Solana';
  decimals: number;
  iconUrl?: string;
  isVerified?: boolean;
  asset: typeof SOL | ReturnType<typeof solanaToken>;
};
export type SwapAsset = (typeof SWAP_ASSETS)['base-eth'] | SolanaSwapAsset;
export const SOLANA_SWAP_OUTPUTS: readonly SolanaSwapAsset[] = [SWAP_ASSETS.sol, SWAP_ASSETS.usdc, SWAP_ASSETS.bonk];
// shortcut: retain a conservative SOL buffer for internal Max; replace with a pre-quote fee/rent estimate before rollout.
export const SOL_FEE_RESERVE = 1_000_000n;

export type SwapReview = {
  inputAsset: SwapAsset;
  outputAsset: SolanaSwapAsset;
  input: bigint;
  prepared: PreparedRouteExecution;
};

export function swapInputAmount(value: string, asset: SwapAsset): bigint {
  const decimals = asset.decimals;
  if (!/^\d+(\.\d*)?$/.test(value) || (value.split('.')[1]?.length ?? 0) > decimals) throw new Error('Enter a valid token amount.');
  const amount = parseUnits(value, decimals);
  if (amount <= 0n) throw new Error('Enter an amount greater than zero.');
  if (asset.chain !== 'evm' && amount > 18_446_744_073_709_551_615n) throw new Error('Amount exceeds the Solana token limit.');
  return amount;
}

export function swapMaxAmount(asset: SwapAsset, balance: bigint): string {
  const spendable = asset.chain === 'solana' && asset.asset.kind === 'native' ? balance - SOL_FEE_RESERVE : balance;
  return formatUnits(spendable > 0n ? spendable : 0n, asset.decimals);
}

export function validateSwapReview(trade: SwapReview): void {
  const { review } = trade.prepared;
  const expected = trade.outputAsset;
  const output = review.output;
  const asset = output.asset;
  const matches =
    asset.location === 'solana' &&
    asset.cluster === expected.asset.cluster &&
    (expected.asset.kind === 'native' ? asset.kind === 'native' : asset.kind === 'token' && asset.address === expected.asset.address);
  if (trade.inputAsset.id === trade.outputAsset.id || trade.input <= 0n || review.inputAmount !== trade.input)
    throw new Error('The quote does not match the selected swap.');
  if (review.sponsorship !== 'full' || (trade.inputAsset.chain === 'evm' && !review.gasless))
    throw new Error('Full provider sponsorship is required.');
  if (
    !matches ||
    output.decimals !== expected.decimals ||
    output.amount <= 0n ||
    output.minimumAmount === undefined ||
    output.minimumAmount <= 0n ||
    output.minimumAmount > output.amount
  )
    throw new Error('The quote is missing the expected output or minimum received amount.');
  if (review.expiresAt <= BigInt(Math.floor(Date.now() / 1000))) throw new Error('Quote expired. Review a new quote before signing.');
}

/** Round down to base units so a percentage never exceeds the spendable balance. */
export function swapPercentageAmount(asset: SwapAsset, balance: bigint, percentage: number): string {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 1) throw new Error('Invalid swap percentage.');
  const max = parseUnits(swapMaxAmount(asset, balance), asset.decimals);
  return formatUnits((max * BigInt(Math.floor(percentage * 10000))) / 10000n, asset.decimals);
}

export function editSwapAmount(current: string, key: number | '.' | 'backspace', decimals: number): string {
  'worklet';
  if (key === 'backspace') return current.length > 1 ? current.slice(0, -1) : '0';
  if (key === '.') return current.includes('.') || decimals === 0 ? current : `${current}.`;
  if (!Number.isInteger(key) || key < 0 || key > 9 || current.length >= 78) return current;
  if (current.includes('.') && current.split('.')[1].length >= decimals) return current;
  return current === '0' ? String(key) : `${current}${key}`;
}
