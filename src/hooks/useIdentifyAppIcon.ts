import { useEffect } from 'react';
import { useAccountSettings } from '@/hooks';
import { analytics } from '@/analytics';

export const useAppIconIdentify = () => {
  const { appIcon } = useAccountSettings();

  useEffect(() => {
    analytics.identify({ appIcon });
  }, [appIcon]);
};
