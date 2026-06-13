import { CASH } from '@/config/experimental';
import useExperimentalFlag from '@/config/experimentalHooks';
import { useRemoteConfig } from '@/model/remoteConfig';

/**
 * Cash is gated by the remote `cash_enabled` flag in production. The `CASH`
 * experimental flag is an in-app override so it can be toggled from Developer Settings.
 */
export function useIsCashEnabled(): boolean {
  const { cash_enabled } = useRemoteConfig('cash_enabled');
  const cashExperimentalEnabled = useExperimentalFlag(CASH);
  return cashExperimentalEnabled || cash_enabled;
}
