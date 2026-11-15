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
import { CONTENT_PLACEHOLDER, EMPTY_WALLET_CONTENT } from '../utils/constants';
import { buildTokenRows } from './buildTokenRows';

const ONLY_NFTS: CellTypes[] = [{ type: CellType.ETH_CARD, uid: 'eth-card' }];
const EMPTY_WITH_DISCOVER: CellTypes[] = [...EMPTY_WALLET_CONTENT, { type: CellType.DISCOVER_MORE_BUTTON, uid: 'discover-home-button' }];

export const useTokensSection = createDerivedStore(
  $ => {
    const assets = $(useWalletAssetsStore, s => s.assets);
    const hiddenAssets = $(useWalletAssetsStore, s => s.hiddenAssets);
    const loading = $(useUserAssetsStore, s => s.getStatus('isInitialLoad'));
    const currency = $(useAppSettingsStore, s => s.currency);
    const pinnedCoins = $(useCurrentPinnedCoins, s => s);

    const editing = $(useEditTokensStore, s => s.isCoinListEdited);
    const expanded = $(useCurrentWalletToggles, s => s.smallBalances);
    const hasNfts = $(useNftsStore, s => s.collections.size > 0);
    const discoverEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('discover_enabled'));

    if (!assets.size && !hiddenAssets.length) {
      if (loading) return CONTENT_PLACEHOLDER;
      if (hasNfts) return ONLY_NFTS;
      return discoverEnabled ? EMPTY_WITH_DISCOVER : EMPTY_WALLET_CONTENT;
    }

    return buildTokenRows({ assets, currency, editing, pinnedCoins, hiddenAssets, expanded });
  },
  { lockDependencies: true }
);
