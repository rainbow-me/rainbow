import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { userAssetsActions } from '@/state/assets/userAssets';

export async function refreshStakingData() {
  await Promise.allSettled([
    useStakingPositionStore.getState().fetch(undefined, { force: true }),
    userAssetsActions.fetch(undefined, { force: true }),
  ]);
}
