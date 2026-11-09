import { createDerivedStore } from '@storesjs/stores';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { IS_TEST } from '@/env';
import { CLAIMABLES } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useClaimablesStore } from '@/state/claimables/claimables';

import { useEditTokensStore } from '../base/editStateStore';
import { useCurrentWalletToggles } from '../base/walletListTogglesStore';

const EMPTY_CLAIMABLES_DATA: CellTypes[] = [];

const CLAIMABLES_SPACE_BEFORE: CellTypes = {
  type: CellType.CLAIMABLES_SPACE_BEFORE,
  uid: 'claimables-spacer-before',
};

const CLAIMABLES_SPACE_AFTER: CellTypes = {
  type: CellType.CLAIMABLES_SPACE_AFTER,
  uid: 'claimables-spacer-after',
};

export const useClaimablesSection = createDerivedStore($ => {
  const isCoinListEdited = $(useEditTokensStore, s => s.isCoinListEdited);
  const remoteConfigEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('claimables'));
  const experimentalConfigEnabled = $(useExperimentalConfigStore, s => s.getFlag(CLAIMABLES));
  const isLoadingUserAssets = $(useUserAssetsStore, s => s.getStatus('isInitialLoad'));
  const claimables = $(useClaimablesStore, s => s.getData());
  const isClaimablesOpen = $(useCurrentWalletToggles, s => s.claimables);

  const claimablesEnabled = (remoteConfigEnabled || experimentalConfigEnabled) && !IS_TEST;

  if (isCoinListEdited || !claimablesEnabled || isLoadingUserAssets || !claimables?.claimables?.length) {
    return EMPTY_CLAIMABLES_DATA;
  }

  const section: CellTypes[] = [
    CLAIMABLES_SPACE_BEFORE,
    {
      type: CellType.CLAIMABLES_HEADER,
      uid: 'claimables-header',
      total: claimables.totalValue,
    },
    CLAIMABLES_SPACE_AFTER,
  ];

  if (isClaimablesOpen) {
    for (const claimable of claimables.claimables) {
      section.push({
        type: CellType.CLAIMABLE,
        claimable,
        uid: `claimable-${claimable.uniqueId}`,
      });
    }
  }

  return section;
});
