import { describe, expect, it, vi } from 'vitest';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';

import { buildBriefWalletSectionsSelector, type WalletSectionsState } from './buildWalletSections';

vi.mock('./assets', () => ({
  buildBriefCoinsList: (assets: unknown[]) => ({
    briefAssets: assets.length
      ? [
          { type: 'COIN', uid: 'evm', uniqueId: 'evm' },
          { type: 'COIN_DIVIDER', uid: 'divider', value: 0, defaultToEditButton: false },
        ]
      : [],
    totalBalancesValue: '0',
  }),
  buildBriefUniqueTokenList: () => [],
}));
const row: CellTypes = {
  type: CellType.SOLANA_COIN,
  uid: 'sol',
  uniqueId: 'sol',
};
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

describe('Solana wallet list composition', () => {
  it('shows SOL-only holdings and the total instead of the empty-wallet cards', () => {
    const result = buildBriefWalletSectionsSelector({ ...state, solanaRows: [row] });
    expect(result.isEmpty).toBe(false);
    expect(result.briefSectionsData).toContainEqual(row);
    expect(result.briefSectionsData.some(r => r.type === CellType.PROFILE_BALANCE_ROW)).toBe(true);
    expect(result.briefSectionsData.some(r => r.type === CellType.RECEIVE_CARD)).toBe(false);
  });
  it('keeps Solana rows alongside EVM and before the small-balance divider', () => {
    const result = buildBriefWalletSectionsSelector({
      ...state,
      sortedAssets: [{}] as WalletSectionsState['sortedAssets'],
      solanaRows: [row],
    });
    const ids = result.briefSectionsData.map(r => r.uid);
    expect(ids.indexOf('evm')).toBeLessThan(ids.indexOf('sol'));
    expect(ids.indexOf('sol')).toBeLessThan(ids.indexOf('divider'));
  });
  it('preserves the legacy list when there are no Solana rows and excludes Solana from EVM editing', () => {
    expect(buildBriefWalletSectionsSelector({ ...state, solanaRows: [] })).toEqual(buildBriefWalletSectionsSelector(state));
    const result = buildBriefWalletSectionsSelector({ ...state, isCoinListEdited: true, solanaRows: [row] });
    expect(result.briefSectionsData.some(r => r.type === CellType.SOLANA_COIN)).toBe(false);
  });
  it('uses the existing asset skeletons when initial balances are loading', () => {
    const result = buildBriefWalletSectionsSelector({ ...state, isLoadingUserAssets: true, solanaRows: [] });
    expect(result.briefSectionsData.some(r => r.type === CellType.LOADING_ASSETS)).toBe(true);
    expect(result.briefSectionsData.some(r => r.type === CellType.RECEIVE_CARD)).toBe(false);
  });
});
