import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { useUserAssetsStore } from '@/state/assets/userAssets';

export async function refreshStakingData() {
  await Promise.allSettled([
    useStakingPositionStore.getState().fetch(undefined, { force: true }),
    useUserAssetsStore.getState().fetch(undefined, { force: true }),
  ]);
}
