import { beforeEach, expect, it, vi } from 'vitest';

import useMemoBriefSectionData from './useMemoBriefSectionData';
import { CellType, type CellTypes } from './ViewTypes';

const state = vi.hoisted(() => ({ open: false, editing: false, hidden: new Set<string>() }));
vi.mock('react', () => ({ useMemo: (compute: () => unknown) => compute() }));
vi.mock('use-deep-compare', () => ({ useDeepCompareMemo: (compute: () => unknown) => compute() }));
vi.mock('@/hooks/useCoinListEdited', () => ({ default: () => ({ isCoinListEdited: state.editing }) }));
vi.mock('@/hooks/useExternalWalletSectionsData', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useWalletSectionsData', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useOpenClaimables', () => ({ default: () => ({ isClaimablesOpen: true }) }));
vi.mock('@/hooks/useOpenPolymarket', () => ({ default: () => ({ isPolymarketOpen: true }) }));
vi.mock('@/hooks/useOpenPositionCards', () => ({ default: () => ({ isPositionCardsOpen: true }) }));
vi.mock('@/state/assets/userAssets', () => ({ useUserAssetsStore: () => state.hidden }));
vi.mock('@/state/nfts/openCollectionsStore', () => ({ useOpenCollectionsStore: () => ({}) }));
vi.mock('@/state/wallets/smallBalancesStore', () => ({ useOpenSmallBalances: () => ({ isSmallBalancesOpen: state.open }) }));

const rows: CellTypes[] = [
  { type: CellType.SOLANA_COIN, uid: 'sol', uniqueId: 'sol' },
  { type: CellType.COIN_DIVIDER, uid: 'divider', value: 0.75, defaultToEditButton: false },
  { type: CellType.COIN, uid: 'eth', uniqueId: 'eth' },
  { type: CellType.SOLANA_COIN, uid: 'bonk', uniqueId: 'bonk' },
];
beforeEach(() => {
  state.open = false;
  state.editing = false;
  state.hidden = new Set();
});

it('collapses EVM and Solana holdings below the same divider', () => {
  const result = useMemoBriefSectionData({ type: 'wallet', briefSectionsData: rows });
  expect(result.memoizedResult.map(row => row.uid)).toEqual(['sol', 'divider']);
});
it('expands both networks while retaining their IDs for row subscriptions', () => {
  state.open = true;
  const result = useMemoBriefSectionData({ type: 'wallet', briefSectionsData: rows });
  expect(result.memoizedResult.map(row => row.uid)).toEqual(['sol', 'divider', 'eth', 'bonk']);
  expect(result.additionalData.bonk).toEqual(rows[3]);
});

it('hides both row types normally and restores them for editing', () => {
  state.open = true;
  state.hidden = new Set(['eth', 'bonk']);
  expect(useMemoBriefSectionData({ type: 'wallet', briefSectionsData: rows }).memoizedResult.map(row => row.uid)).toEqual([
    'sol',
    'divider',
  ]);
  state.editing = true;
  expect(useMemoBriefSectionData({ type: 'wallet', briefSectionsData: rows }).memoizedResult.map(row => row.uid)).toEqual([
    'sol',
    'divider',
    'eth',
    'bonk',
  ]);
});
