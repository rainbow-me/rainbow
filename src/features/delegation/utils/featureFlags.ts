import { DELEGATION } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { getExperimentalFlag } from '@/features/config/stores/experimentalConfigStore';
import { getRemoteConfig, useRemoteConfig } from '@/features/config/stores/remoteConfig';

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
