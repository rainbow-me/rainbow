import { address, type Address } from '@solana/addresses';

import { SolanaCluster, type PreparedRouteExecution } from '@rainbow-me/solana-sdk';

export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const BONK = address('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
export const SOLANA_USDC = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const BUY_AMOUNT = 1_000_000n;
export const MAX_SELL_AMOUNT = 100_000n * 100_000n;
export type MvpRoute = 'buy' | 'sell';
export const solanaToken = (mint: Address) =>
  ({ location: 'solana', kind: 'token', cluster: SolanaCluster.Mainnet, address: mint }) as const;

export function sellAmount(balance: bigint): bigint {
  if (balance <= 0n) throw new Error('This account has no BONK to swap. Buy BONK first.');
  return balance < MAX_SELL_AMOUNT ? balance : MAX_SELL_AMOUNT;
}

/** Validate the review as well as the SDK request so the confirmation cannot silently change policy. */
export function validateMvpReview(route: MvpRoute, input: bigint, prepared: PreparedRouteExecution): void {
  const { review } = prepared;
  const mint = route === 'buy' ? BONK : SOLANA_USDC;
  if (input <= 0n || (route === 'buy' ? input !== BUY_AMOUNT : input > MAX_SELL_AMOUNT) || review.inputAmount !== input) {
    throw new Error('The quote changed the bounded test amount.');
  }
  if (!review.gasless || review.sponsorship !== 'full')
    throw new Error('Full sponsorship is required. No user-paid gas fallback is allowed.');
  const { output } = review;
  if (
    output.asset.location !== 'solana' ||
    output.asset.kind !== 'token' ||
    output.asset.cluster !== SolanaCluster.Mainnet ||
    output.asset.address !== mint ||
    output.decimals !== (route === 'buy' ? 5 : 6) ||
    output.amount <= 0n ||
    output.minimumAmount === undefined ||
    output.minimumAmount <= 0n ||
    output.minimumAmount > output.amount
  ) {
    throw new Error('The quote must include the expected token and a positive minimum received amount.');
  }
  if (review.expiresAt <= BigInt(Math.floor(Date.now() / 1000))) throw new Error('The quote expired. Request a new quote.');
}
