import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import watchingAlert from '@/utils/watchingAlert';

/**
 * Blocks staking entry for wallets that cannot submit staking transactions.
 */
export function blockRnbwStakingAccessIfNeeded(): boolean {
  if (getIsReadOnlyWallet()) {
    watchingAlert();
    return true;
  }
  return false;
}
