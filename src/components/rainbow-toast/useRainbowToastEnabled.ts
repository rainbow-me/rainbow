import { IS_TEST } from '@/env';
import { RAINBOW_TOASTS } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';

export const useRainbowToastEnabled = () => {
  const { rainbow_toasts_enabled } = useRemoteConfig('rainbow_toasts_enabled');
  const isEnabled = useExperimentalFlag(RAINBOW_TOASTS);
  return IS_TEST || isEnabled || rainbow_toasts_enabled;
};
