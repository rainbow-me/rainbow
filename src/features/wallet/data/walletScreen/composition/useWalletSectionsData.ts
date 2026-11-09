import { createDerivedStore } from '@storesjs/stores';

import { createListData } from '@/components/asset-list/RecyclerAssetList2/core/createListData';
import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { IS_TEST } from '@/env';
import { RNBW_REWARDS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useNftsEnabled } from '@/features/nfts/data/nftsEnabledStore';
import { useWalletNftRows } from '@/features/nfts/data/walletNftRowsStore';
import { useRnbwFeatureCard } from '@/features/rnbw-rewards/hooks/useRnbwFeatureCard';
import { useUserAssetsStore } from '@/state/assets/userAssets';

import { useEditTokensStore } from '../base/editStateStore';
import { useClaimablesSection } from '../sections/useClaimablesSection';
import { useHeaderSection } from '../sections/useHeaderSection';
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
export const useWalletSectionsData = createDerivedStore($ => {
  const header = $(useHeaderSection);
  const tokens = $(useTokensSection);
  const perps = $(usePerpsSection);
  const predictions = $(usePolymarketSection);
  const claimables = $(useClaimablesSection);
  const positions = $(usePositionsSection);
  const nftsEnabled = $(useNftsEnabled);
  const nfts = $(useWalletNftRows);
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
        ...(editing ? EMPTY_ROWS : nfts),
      ]
    : [
        ...header.header,
        ...feature,
        ...tokens,
        ...perps.section,
        ...predictions.section,
        ...claimables,
        ...positions,
        ...(editing ? EMPTY_ROWS : nfts),
      ];

  return { ...createListData(briefSectionsData, editing, nftsEnabled), isEmpty: header.isEmpty, isLoadingUserAssets };
});
