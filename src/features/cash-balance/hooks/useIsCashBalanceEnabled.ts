import { CASH_BALANCE } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';

/**
 * Cash Balance wallet display is gated by the remote `cash_balance_enabled` flag in
 * production. The `CASH_BALANCE` experimental flag is an in-app override so it can be
 * toggled from Developer Settings.
 *
 * This is distinct from `useIsCashEnabled`, which gates the separate "Add Cash"
 * onramp/KYC-buy feature in `@/features/cash`.
 */
export function useIsCashBalanceEnabled(): boolean {
  const { cash_balance_enabled } = useRemoteConfig('cash_balance_enabled');
  const cashBalanceExperimentalEnabled = useExperimentalFlag(CASH_BALANCE);
  return cashBalanceExperimentalEnabled || cash_balance_enabled;
}
