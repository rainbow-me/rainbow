import { CASH } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';

/**
 * Cash is gated by the remote `cash_enabled` flag in production. The `CASH`
 * experimental flag is an in-app override so it can be toggled from Developer Settings.
 */
export function useIsCashEnabled(): boolean {
  const { cash_enabled } = useRemoteConfig('cash_enabled');
  const cashExperimentalEnabled = useExperimentalFlag(CASH);
  return cashExperimentalEnabled || cash_enabled;
}
