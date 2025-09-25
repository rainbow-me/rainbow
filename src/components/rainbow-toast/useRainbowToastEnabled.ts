import { RAINBOW_TOASTS, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { useRemoteConfig } from '@/model/remoteConfig';

export const useRainbowToastEnabled = () => {
  const { rainbow_toasts_enabled } = useRemoteConfig('rainbow_toasts_enabled');
  const isEnabled = useExperimentalFlag(RAINBOW_TOASTS);
  return IS_TEST || isEnabled || rainbow_toasts_enabled;
};
