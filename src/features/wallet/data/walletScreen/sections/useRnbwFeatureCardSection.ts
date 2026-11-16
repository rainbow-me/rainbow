import { createDerivedStore } from '@storesjs/stores';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { IS_TEST } from '@/env';
import { RNBW_REWARDS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useRnbwFeatureCard } from '@/features/rnbw-rewards/hooks/useRnbwFeatureCard';

import { useEditTokensStore } from '../base/editStateStore';

const EMPTY_SECTION: CellTypes[] = [];
const FEATURE_CARD_SECTION: CellTypes[] = [
  { type: CellType.SPACER, uid: 'rnbw-feature-card-before-spacer', height: 16 },
  { type: CellType.RNBW_FEATURE_CARD, uid: 'rnbw-feature-card' },
  { type: CellType.SPACER, uid: 'rnbw-feature-card-after-spacer', height: 24 },
];

export const useRnbwFeatureCardSection = createDerivedStore(
  $ => {
    const editing = $(useEditTokensStore, s => s.isCoinListEdited);
    const remoteEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('rnbw_rewards_enabled'));
    const experimentalEnabled = $(useExperimentalConfigStore, s => s.getFlag(RNBW_REWARDS));
    const dismissed = $(useRnbwFeatureCard, s => s.isDismissed);

    return !editing && !IS_TEST && !dismissed && (remoteEnabled || experimentalEnabled) ? FEATURE_CARD_SECTION : EMPTY_SECTION;
  },
  { lockDependencies: true }
);
