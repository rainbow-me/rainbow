import useExperimentalFlag, { DELEGATION, getExperimentalFlag } from '@/config/experimentalHooks';
import { getRemoteConfig, useRemoteConfig } from '@/model/remoteConfig';

// ============ Delegation Flags ============================================== //

/**
 * Synchronous check that returns `true` when delegation is enabled by local
 * experimental flag or remote config.
 */
export function isDelegationEnabled(): boolean {
  return getExperimentalFlag(DELEGATION) || getRemoteConfig().delegation_enabled;
}

/**
 * Hook that returns `true` when delegation is enabled by local experimental
 * flag or remote config.
 */
export function useIsDelegationEnabled(): boolean {
  const localDelegationEnabled = useExperimentalFlag(DELEGATION);
  const remoteDelegationEnabled = useRemoteConfig('delegation_enabled').delegation_enabled;
  return localDelegationEnabled || remoteDelegationEnabled;
}
