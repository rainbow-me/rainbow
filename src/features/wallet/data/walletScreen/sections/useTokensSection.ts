import { createDerivedStore } from '@storesjs/stores';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { useWalletAssetsStore } from '@/features/wallet/data/walletAssetsStore';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useNftsStore } from '@/state/nfts/nfts';

import { useEditTokensStore } from '../base/editStateStore';
import { useCurrentPinnedCoins } from '../base/pinnedCoinsStore';
import { useCurrentWalletToggles } from '../base/walletListTogglesStore';
import { buildTokenRows } from './buildTokenRows';

// ============ Constants ====================================================== //

const CONTENT_PLACEHOLDER: CellTypes[] = [
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-1' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-2' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-3' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-4' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-5' },
];
const EMPTY_WALLET_CONTENT: CellTypes[] = [
  { type: CellType.RECEIVE_CARD, uid: 'receive_card' },
  { type: CellType.EMPTY_WALLET_SPACER, uid: 'empty-wallet-spacer-1' },
  { type: CellType.ETH_CARD, uid: 'eth-card' },
  { type: CellType.EMPTY_WALLET_SPACER, uid: 'empty-wallet-spacer-2' },
  { type: CellType.LEARN_CARD, uid: 'learn-card' },
  { type: CellType.BIG_EMPTY_WALLET_SPACER, uid: 'big-empty-wallet-spacer-2' },
];
const EMPTY_WITH_DISCOVER: CellTypes[] = [...EMPTY_WALLET_CONTENT, { type: CellType.DISCOVER_MORE_BUTTON, uid: 'discover-home-button' }];
const ONLY_NFTS: CellTypes[] = [{ type: CellType.ETH_CARD, uid: 'eth-card' }];

// ============ Token Section ================================================== //

export const useTokensSection = createDerivedStore(
  $ => {
    const walletAssets = $(useWalletAssetsStore, s => s);
    const loading = $(useUserAssetsStore, s => s.isInitialLoad());
    const currency = $(useAppSettingsStore, s => s.currency);
    const pinnedCoins = $(useCurrentPinnedCoins, s => s);

    const editing = $(useEditTokensStore, s => s.isCoinListEdited);
    const expanded = $(useCurrentWalletToggles, s => s.smallBalances);
    const hasNfts = $(useNftsStore, s => s.collections.size > 0);
    const discoverEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('discover_enabled'));

    if (!walletAssets.assets.size && !walletAssets.hiddenAssets.length) {
      if (loading) return CONTENT_PLACEHOLDER;
      if (hasNfts) return ONLY_NFTS;
      return discoverEnabled ? EMPTY_WITH_DISCOVER : EMPTY_WALLET_CONTENT;
    }

    return buildTokenRows({ ...walletAssets, currency, editing, pinnedCoins, expanded });
  },
  { lockDependencies: true }
);
