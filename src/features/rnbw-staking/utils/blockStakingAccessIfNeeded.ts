import { watchingAlert } from '@/features/wallet/utils/watchingAlert';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';

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
