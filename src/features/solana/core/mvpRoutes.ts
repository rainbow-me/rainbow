import { address, type Address } from '@solana/addresses';
import BigNumber from 'bignumber.js';

import { ChainId } from '@/features/network/types/backendNetworks';
import { SolanaCluster, type PreparedRouteExecution } from '@rainbow-me/solana-sdk';

export const BONK = address('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
export const SOLANA_USDC = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const SOL = { location: 'solana', kind: 'native', cluster: SolanaCluster.Mainnet } as const;
export const BASE_USDC = {
  location: 'evm',
  kind: 'erc20',
  chainId: ChainId.base,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;
export const SOL_TO_BASE_AMOUNT = 10_000_000n; // 0.01 SOL
export const MAX_SELL_AMOUNT = 100_000n * 100_000n;
export type MvpRoute = 'buy' | 'buyBonk' | 'sell' | 'solToBase';
export const solanaToken = (mint: Address) =>
  ({ location: 'solana', kind: 'token', cluster: SolanaCluster.Mainnet, address: mint }) as const;

// Round down so the input never exceeds $1 at the fetched USD price.
export function buyAmount(ethUsdPrice: number | null | undefined): bigint {
  if (ethUsdPrice == null || !Number.isFinite(ethUsdPrice) || ethUsdPrice <= 0) throw new Error('Unable to price $1 of ETH. Try again.');
  const amount = BigInt(new BigNumber('1e18').dividedToIntegerBy(ethUsdPrice).toFixed(0));
  if (amount <= 0n) throw new Error('The ETH price produces an invalid test amount.');
  return amount;
}

export function sellAmount(balance: bigint): bigint {
  if (balance <= 0n) throw new Error('This account has no BONK to swap.');
  return balance < MAX_SELL_AMOUNT ? balance : MAX_SELL_AMOUNT;
}

/** Validate the review as well as the SDK request so the confirmation cannot silently change policy. */
export function validateMvpReview(route: MvpRoute, input: bigint, prepared: PreparedRouteExecution): void {
  const { review } = prepared;
  if (
    input <= 0n ||
    (route === 'sell' && input > MAX_SELL_AMOUNT) ||
    (route === 'solToBase' && input !== SOL_TO_BASE_AMOUNT) ||
    review.inputAmount !== input
  ) {
    throw new Error('The quote changed the bounded test amount.');
  }
  if (((route === 'buy' || route === 'buyBonk') && !review.gasless) || review.sponsorship !== 'full')
    throw new Error('Full provider sponsorship is required; only Solana source network fees may be wallet-paid.');
  const { output } = review;
  const expectedAsset =
    route === 'solToBase'
      ? output.asset.location === 'evm' &&
        output.asset.kind === 'erc20' &&
        output.asset.chainId === ChainId.base &&
        output.asset.address.toLowerCase() === BASE_USDC.address.toLowerCase()
      : output.asset.location === 'solana' &&
        output.asset.cluster === SolanaCluster.Mainnet &&
        (route === 'buy'
          ? output.asset.kind === 'native'
          : output.asset.kind === 'token' && output.asset.address === (route === 'buyBonk' ? BONK : SOLANA_USDC));
  if (
    !expectedAsset ||
    output.decimals !== (route === 'buy' ? 9 : route === 'buyBonk' ? 5 : 6) ||
    output.amount <= 0n ||
    output.minimumAmount === undefined ||
    output.minimumAmount <= 0n ||
    output.minimumAmount > output.amount
  ) {
    throw new Error('The quote must include the expected asset and a positive minimum received amount.');
  }
  if (review.expiresAt <= BigInt(Math.floor(Date.now() / 1000))) throw new Error('The quote expired. Request a new quote.');
}
