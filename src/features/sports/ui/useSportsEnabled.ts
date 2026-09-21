import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';

export function useSportsEnabled(): boolean {
  const { polymarket_enabled } = useRemoteConfig('polymarket_enabled');
  const enabledLocally = useExperimentalFlag(POLYMARKET);
  return polymarket_enabled || enabledLocally;
}
