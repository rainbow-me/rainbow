import { useEffect } from 'react';

import { analytics } from '@/analytics';
import useAccountSettings from '@/hooks/useAccountSettings';

export const useAppIconIdentify = () => {
  const { appIcon } = useAccountSettings();

  useEffect(() => {
    analytics.identify({ appIcon });
  }, [appIcon]);
};
