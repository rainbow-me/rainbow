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

export const useTokensSection = createDerivedStore($ => {
  const assets = $(useWalletAssetsStore, state => state.assets);
  const hiddenCoins = $(useUserAssetsStore, state => state.hiddenAssets);
  const loading = $(useUserAssetsStore, state => state.getStatus('isInitialLoad'));
  const currency = $(useAppSettingsStore, state => state.currency);
  const pinnedCoins = $(useCurrentPinnedCoins);
  const editing = $(useEditTokensStore, state => state.isCoinListEdited);
  const expanded = $(useCurrentWalletToggles, state => state.smallBalances);
  const hasNfts = $(useNftsStore, state => state.collections.size > 0);
  const discover = $(useRemoteConfigStore, state => state.getRemoteConfigKey('discover_enabled'));

  if (!assets.size) {
    if (loading) return CONTENT_PLACEHOLDER;
    if (hasNfts) return ONLY_NFTS;
    return discover ? EMPTY_WITH_DISCOVER : EMPTY_WALLET_CONTENT;
  }
  return buildTokenRows({ assets, currency, editing, pinnedCoins, hiddenCoins, expanded });
});
