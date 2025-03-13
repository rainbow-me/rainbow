import { useEffect } from 'react';
import { useAccountSettings } from '@/hooks';
import { analyticsV2 } from '@/analytics';
export const useAppIconIdentify = () => {
  const { appIcon } = useAccountSettings();

  // track current app icon
  useEffect(() => {
    analyticsV2.identify({ appIcon });
  }, [appIcon]);
};
