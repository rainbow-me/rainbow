import { getExperimentalFlag } from '@/config/experimentalConfigStore';
import { RNBW_MEMBERSHIP } from '@/config/experimentalHooks';
import { getRemoteConfig } from '@/model/remoteConfig';

import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';

export async function prefetchRnbwStakingPosition() {
  if (!isRnbwMembershipEnabled()) return;

  await useStakingPositionStore.getState().fetch(undefined, { force: true });
}

function isRnbwMembershipEnabled(): boolean {
  return getExperimentalFlag(RNBW_MEMBERSHIP) || getRemoteConfig().rnbw_membership_enabled;
}
