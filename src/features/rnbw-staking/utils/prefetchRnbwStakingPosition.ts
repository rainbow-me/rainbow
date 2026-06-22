import { RNBW_MEMBERSHIP } from '@/features/config/constants/experimental';
import { getExperimentalFlag } from '@/features/config/stores/experimentalConfigStore';
import { getRemoteConfig } from '@/features/config/stores/remoteConfig';

import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';

export async function prefetchRnbwStakingPosition() {
  if (!isRnbwMembershipEnabled()) return;

  await useStakingPositionStore.getState().fetch(undefined, { force: true });
}

function isRnbwMembershipEnabled(): boolean {
  return getExperimentalFlag(RNBW_MEMBERSHIP) || getRemoteConfig().rnbw_membership_enabled;
}
