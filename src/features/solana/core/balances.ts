import BigNumber from 'bignumber.js';
import { z } from 'zod';

import { type SolanaAssetId } from '@/__swaps__/types/assets';

import { isSolanaAddress } from './address';
import { SOLANA_CHAIN_ID, SOLANA_MAINNET_CHAIN } from './chainId';

export function solanaBalanceAccountId(address: string): string {
  if (!isSolanaAddress(address)) throw new Error('Invalid Solana balances address.');
  return `${SOLANA_MAINNET_CHAIN}:${address}`;
}

const decimal = z.string().regex(/^\d+(\.\d+)?$/);
const balanceSchema = z.object({
  accountId: z.string(),
  quantity: z.string().regex(/^\d+$/),
  value: decimal.optional(),
  asset: z.object({
    assetId: z.string(),
    chainId: z.string(),
    name: z.string().optional(),
    symbol: z.string().optional(),
    iconUrl: z.string().optional(),
    decimals: z.number().int().min(0).max(255).optional(),
    price: z
      .object({
        value: z.number().finite().nonnegative().optional(),
        relativeChange24h: z.number().finite().optional(),
      })
      .nullish(),
  }),
});

// Only the fields this milestone consumes; the experimental asset shape will change.
const responseSchema = z.object({
  metadata: z.object({ success: z.literal(true), currency: z.string() }),
  result: z.object({
    balances: z.array(balanceSchema).default([]),
    failedQueries: z.array(z.object({ accountId: z.string() })).default([]),
  }),
  errors: z.array(z.string()).default([]),
});

export type SolanaBalance = {
  assetId: string;
  uniqueId: SolanaAssetId;
  name: string;
  symbol: string;
  iconUrl?: string;
  relativeChange24h?: number;
  amount: string;
  rawUnits: boolean;
  value: string | null;
};
export type SolanaBalances = {
  address: string;
  currency: string;
  balances: SolanaBalance[];
  total: string;
};

const TOKEN_LABELS: Record<string, { name: string; symbol: string }> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { name: 'USD Coin', symbol: 'USDC' },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: { name: 'Bonk', symbol: 'BONK' },
};

export function parseSolanaBalances(response: unknown, address: string, currency: string): SolanaBalances {
  const accountId = solanaBalanceAccountId(address);
  const parsed = responseSchema.parse(response);
  if (parsed.metadata.currency.toUpperCase() !== currency.toUpperCase()) throw new Error('Balances currency mismatch.');
  if (parsed.result.failedQueries.length || parsed.errors.length) throw new Error('Solana balances could not be refreshed.');
  const ids = new Set<string>();
  const balances: SolanaBalance[] = [];
  let total = new BigNumber(0);
  for (const item of parsed.result.balances) {
    const { asset } = item;
    const prefix = `${SOLANA_MAINNET_CHAIN}/`;
    const [namespace, reference, extra] = asset.assetId.slice(prefix.length).split(':');
    if (
      item.accountId !== accountId ||
      asset.chainId !== SOLANA_MAINNET_CHAIN ||
      !asset.assetId.startsWith(prefix) ||
      !['native', 'token'].includes(namespace) ||
      extra !== undefined ||
      !isSolanaAddress(reference)
    )
      throw new Error('Invalid Solana balance identity.');
    const uniqueId: SolanaAssetId = `${reference}_${SOLANA_CHAIN_ID}`;
    if (ids.has(uniqueId)) throw new Error('Invalid Solana balance identity.');
    ids.add(uniqueId);
    const native = namespace === 'native';
    if (native && asset.decimals !== undefined && asset.decimals !== 9) throw new Error('Invalid SOL decimals.');
    const decimals = native ? 9 : asset.decimals;
    const quantity = new BigNumber(item.quantity);
    if (quantity.isZero()) continue;
    const fallback = native ? { name: 'Solana', symbol: 'SOL' } : TOKEN_LABELS[reference];
    const shortAddress = `${reference.slice(0, 4)}…${reference.slice(-4)}`;
    // A zero value without a price is the backend's missing-price placeholder, not a valuation.
    const value = item.value !== undefined && (new BigNumber(item.value).gt(0) || (asset.price?.value ?? 0) > 0) ? item.value : null;
    if (value !== null) total = total.plus(value);
    balances.push({
      assetId: asset.assetId,
      uniqueId,
      name: asset.name || fallback?.name || shortAddress,
      symbol: asset.symbol || fallback?.symbol || shortAddress,
      iconUrl: asset.iconUrl || undefined,
      relativeChange24h: asset.price?.relativeChange24h,
      amount: quantity.shiftedBy(-(decimals ?? 0)).toFixed(),
      rawUnits: decimals === undefined,
      value,
    });
  }
  balances.sort((a, b) => new BigNumber(b.value ?? -1).comparedTo(a.value ?? -1) || a.assetId.localeCompare(b.assetId));
  return { address, currency, balances, total: total.toFixed() };
}
