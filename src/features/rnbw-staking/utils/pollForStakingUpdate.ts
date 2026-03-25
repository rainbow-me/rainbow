import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

const POLL_INTERVAL_MS = time.seconds(1);
const MAX_POLL_ATTEMPTS = 5;

export async function pollForStakingUpdate(originalStakedRnbwShares: string): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    await useStakingPositionStore.getState().fetch(undefined, { force: true });

    const currentStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares;

    if (currentStakedRnbwShares !== originalStakedRnbwShares) {
      await useUserAssetsStore.getState().fetch(undefined, { force: true });
      return true;
    }

    await delay(POLL_INTERVAL_MS);
  }

  return false;
}
