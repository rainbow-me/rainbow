import { useEffect } from 'react';
import useAccountSettings from '@/hooks/useAccountSettings';
import { analytics } from '@/analytics';

export const useAppIconIdentify = () => {
  const { appIcon } = useAccountSettings();

  useEffect(() => {
    analytics.identify({ appIcon });
  }, [appIcon]);
};
