import { RAINBOW_TOASTS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';

export const useRainbowToastEnabled = () => {
  const { rainbow_toasts_enabled } = useRemoteConfig('rainbow_toasts_enabled');
  return useExperimentalFlag(RAINBOW_TOASTS) || rainbow_toasts_enabled;
};
