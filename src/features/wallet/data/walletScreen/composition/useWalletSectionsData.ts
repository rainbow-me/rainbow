import { createDerivedStore, shallowEqual } from '@storesjs/stores';
import { DataProvider } from 'recyclerlistview';

import { getLayoutProvider } from '@/components/asset-list/RecyclerAssetList2/core/getLayoutProvider';
import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { IS_TEST } from '@/env';
import { NFTS_ENABLED, RNBW_REWARDS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useRnbwFeatureCard } from '@/features/rnbw-rewards/hooks/useRnbwFeatureCard';
import { useUserAssetsStore } from '@/state/assets/userAssets';

import { useEditTokensStore } from '../base/editStateStore';
import { useClaimablesSection } from '../sections/useClaimablesSection';
import { useHeaderSection } from '../sections/useHeaderSection';
import { useNftsSection, useSelectableNftsSection } from '../sections/useNftsSection';
import { usePerpsSection } from '../sections/usePerpsSection';
import { usePolymarketSection } from '../sections/usePolymarketSection';
import { usePositionsSection } from '../sections/usePositionsSection';
import { useTokensSection } from '../sections/useTokensSection';

const TOKENS_HEADER: CellTypes[] = [
  { type: CellType.SPACER, uid: 'tokens-header-spacer-after', height: 10 },
  { type: CellType.TOKENS_HEADER, uid: 'tokens-header' },
];
const FEATURE_CARD: CellTypes[] = [
  { type: CellType.SPACER, uid: 'rnbw-feature-card-before-spacer', height: 16 },
  { type: CellType.RNBW_FEATURE_CARD, uid: 'rnbw-feature-card' },
  { type: CellType.SPACER, uid: 'rnbw-feature-card-after-spacer', height: 24 },
];
const EMPTY_ROWS: CellTypes[] = [];
const dataProvider = new DataProvider((before: CellTypes, after: CellTypes) => !shallowEqual(before, after));

export const useNftsEnabled = createDerivedStore($ => {
  const remote = $(useRemoteConfigStore, state => state.getRemoteConfigKey('nfts_enabled'));
  const experimental = $(useExperimentalConfigStore, state => state.getFlag(NFTS_ENABLED));
  return remote || experimental;
});

export const useWalletSectionsData = createDerivedStore($ => {
  const header = $(useHeaderSection);
  const tokens = $(useTokensSection);
  const perps = $(usePerpsSection);
  const predictions = $(usePolymarketSection);
  const claimables = $(useClaimablesSection);
  const positions = $(usePositionsSection);
  const nftsEnabled = $(useNftsEnabled);
  const nfts = $(useNftsSection);
  const editing = $(useEditTokensStore, state => state.isCoinListEdited);
  const rewardsEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('rnbw_rewards_enabled'));
  const rewardsExperimental = $(useExperimentalConfigStore, state => state.getFlag(RNBW_REWARDS));
  const featureDismissed = $(useRnbwFeatureCard, state => state.isDismissed);
  const isLoadingUserAssets = $(useUserAssetsStore, state => state.getStatus('isInitialLoad'));

  const feature = !editing && !IS_TEST && (rewardsEnabled || rewardsExperimental) && !featureDismissed ? FEATURE_CARD : EMPTY_ROWS;
  const tokenHeader =
    perps.hasContent && tokens.some(row => row.type === CellType.COIN || row.type === CellType.LOADING_ASSETS) ? TOKENS_HEADER : EMPTY_ROWS;
  const briefSectionsData = perps.hasContent
    ? [
        ...header.header,
        ...feature,
        ...perps.section,
        ...(predictions.hasContent ? predictions.section : EMPTY_ROWS),
        ...tokenHeader,
        ...tokens,
        ...(!predictions.hasContent ? predictions.section : EMPTY_ROWS),
        ...claimables,
        ...positions,
        ...nfts,
      ]
    : [...header.header, ...feature, ...tokens, ...perps.section, ...predictions.section, ...claimables, ...positions, ...nfts];

  return { ...createListData(briefSectionsData, editing, nftsEnabled), isEmpty: header.isEmpty, isLoadingUserAssets };
});

export const useSelectableNftsListData = createDerivedStore($ => {
  const rows = $(useSelectableNftsSection);
  const nftsEnabled = $(useNftsEnabled);
  return createListData(rows, false, nftsEnabled);
});

export function createListData(briefSectionsData: CellTypes[], isCoinListEdited: boolean, nftsEnabled: boolean) {
  return {
    briefSectionsData,
    dataProvider: dataProvider.cloneWithRows(briefSectionsData),
    layoutProvider: getLayoutProvider({ briefSectionsData, isCoinListEdited, nftsEnabled }),
  };
}

export type WalletListData = ReturnType<typeof createListData>;
