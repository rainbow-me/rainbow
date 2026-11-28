import { describe, expect, it, vi } from 'vitest';

import { type SolanaAssetId } from '@/__swaps__/types/assets';
import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { type ParsedAddressAsset } from '@/entities/tokens';

import { buildBriefWalletSectionsSelector, type WalletSectionsState } from './buildWalletSections';

vi.mock('@/handlers/web3', () => ({ assetIsUniqueAsset: () => false }));
vi.mock('@/languages', () => ({}));
vi.mock('@/resources/nfts/utils', () => ({ parseUniqueId: () => ({}) }));
vi.mock('./assets', async importOriginal => ({
  ...(await importOriginal<typeof import('./assets')>()),
  buildBriefUniqueTokenList: () => [],
}));
const solId = 'So11111111111111111111111111111111111111111_1399811149' as SolanaAssetId;
const bonkId = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263_1399811149' as SolanaAssetId;
const unknownId = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_1399811149' as SolanaAssetId;
const sol = { uniqueId: solId, value: '20' };
const state = {
  sortedAssets: [],
  hiddenAssets: new Set(),
  isCoinListEdited: false,
  isLoadingUserAssets: false,
  isLoadingBalance: false,
  nativeCurrency: 'USD',
  pinnedCoins: {},
  collections: new Map(),
  perpsData: { enabled: false },
  polymarketData: { enabled: false },
  rnbwRewardsEnabled: false,
} as unknown as WalletSectionsState;
const evm = (uniqueId: string, amount: string) => ({ uniqueId, native: { balance: { amount } } }) as ParsedAddressAsset;
const sections = (overrides: Partial<WalletSectionsState>) =>
  buildBriefWalletSectionsSelector({ ...state, ...overrides }).briefSectionsData;
const coinIds = (rows: CellTypes[]) =>
  rows.flatMap(row => ('uniqueId' in row && (row.type === CellType.COIN || row.type === CellType.SOLANA_COIN) ? [row.uniqueId] : []));
const split = (rows: CellTypes[]) => {
  const dividerIndex = rows.findIndex(row => row.type === CellType.COIN_DIVIDER);
  return { above: coinIds(rows.slice(0, dividerIndex)), below: coinIds(rows.slice(dividerIndex + 1)), divider: rows[dividerIndex] };
};

describe('Solana wallet list composition', () => {
  it('shows SOL-only holdings and the total instead of the empty-wallet cards', () => {
    const result = buildBriefWalletSectionsSelector({ ...state, solanaBalances: [sol] });
    expect(result.isEmpty).toBe(false);
    expect(coinIds(result.briefSectionsData)).toEqual([solId]);
    expect(result.briefSectionsData.some(row => row.type === CellType.PROFILE_BALANCE_ROW)).toBe(true);
    expect(result.briefSectionsData.some(row => row.type === CellType.RECEIVE_CARD)).toBe(false);
  });
  it('sorts both networks together and applies the five-row limit and divider total', () => {
    const rows = sections({
      sortedAssets: [evm('eth', '100'), evm('base', '80'), evm('op', '60'), evm('arb', '40'), evm('usdc', '10')],
      solanaBalances: [sol, { uniqueId: bonkId, value: '0.5' }],
    });
    expect(split(rows)).toMatchObject({ above: ['eth', 'base', 'op', 'arb', solId], below: ['usdc', bonkId], divider: { value: '10.5' } });
    const lowerSol = sections({
      sortedAssets: [evm('eth', '100'), evm('base', '80'), evm('op', '60'), evm('arb', '40'), evm('usdc', '10')],
      solanaBalances: [{ ...sol, value: '5' }],
    });
    expect(split(lowerSol)).toMatchObject({ above: ['eth', 'base', 'op', 'arb', 'usdc'], below: [solId], divider: { value: '5' } });
  });
  it('moves Solana below the divider when its value drops to the threshold', () => {
    const input = { sortedAssets: [evm('eth', '100')], solanaBalances: [sol] };
    expect(split(sections(input)).above).toEqual(['eth', solId]);
    expect(split(sections({ ...input, solanaBalances: [{ ...sol, value: '1' }] }))).toMatchObject({ above: ['eth'], below: [solId] });
  });
  it('uses the selected currency threshold and treats missing prices as zero', () => {
    const rows = sections({
      nativeCurrency: 'JPY',
      sortedAssets: [evm('eth', '1000')],
      solanaBalances: [sol, { uniqueId: unknownId, value: null }],
    });
    expect(split(rows)).toMatchObject({ above: ['eth'], below: [solId, unknownId], divider: { value: '20' } });
  });
  it('shows five small holdings when there are no standard holdings', () => {
    const rows = sections({
      solanaBalances: Array.from({ length: 6 }, (_, i) => ({ uniqueId: `sol-${i}` as SolanaAssetId, value: `0.${6 - i}` })),
    });
    expect(split(rows)).toMatchObject({ above: ['sol-0', 'sol-1', 'sol-2', 'sol-3', 'sol-4'], below: ['sol-5'] });
  });
  it('preserves pinned EVM priority and excludes hidden EVM holdings', () => {
    const rows = sections({
      sortedAssets: [evm('hidden', '100'), evm('pinned', '0.1')],
      pinnedCoins: { pinned: true },
      hiddenAssets: new Set(['hidden']) as WalletSectionsState['hiddenAssets'],
      solanaBalances: [sol],
    });
    expect(split(rows).above).toEqual(['pinned', solId]);
    expect(coinIds(rows)).not.toContain('hidden');
  });
  it('preserves the legacy list with no Solana holdings and includes Solana during editing', () => {
    const input = { ...state, sortedAssets: [evm('eth', '100')] };
    expect(buildBriefWalletSectionsSelector({ ...input, solanaBalances: [] })).toEqual(buildBriefWalletSectionsSelector(input));
    const rows = sections({ ...input, isCoinListEdited: true, solanaBalances: [sol] });
    expect(rows.some(row => row.type === CellType.SOLANA_COIN)).toBe(true);
  });
  it('uses the existing asset skeletons when initial balances are loading', () => {
    const rows = sections({ isLoadingUserAssets: true });
    expect(rows.some(row => row.type === CellType.LOADING_ASSETS)).toBe(true);
    expect(rows.some(row => row.type === CellType.RECEIVE_CARD)).toBe(false);
  });
});

it('pins and hides Solana IDs with the same list rules, retaining hidden rows in edit mode', () => {
  const id = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_1399811149' as SolanaAssetId;
  const input = { sortedAssets: [evm('eth', '100')], solanaBalances: [{ uniqueId: id, value: '0.1' }] };
  expect(split(sections({ ...input, pinnedCoins: { [id]: true } })).above).toEqual([id, 'eth']);
  const hidden = { ...input, hiddenAssets: new Set([id]) };
  expect(coinIds(sections(hidden))).toEqual(['eth']);
  expect(coinIds(sections({ ...hidden, isCoinListEdited: true }))).toEqual(['eth', id]);
});
