import { SOLANA } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';

/**
 * Solana is gated by the remote `solana_enabled` flag in production.
 * The `SOLANA` experimental flag is an in-app override in Developer Settings.
 */
export function useIsSolanaEnabled(): boolean {
  const { solana_enabled } = useRemoteConfig('solana_enabled');
  const solanaExperimentalEnabled = useExperimentalFlag(SOLANA);
  return solanaExperimentalEnabled || solana_enabled;
}
