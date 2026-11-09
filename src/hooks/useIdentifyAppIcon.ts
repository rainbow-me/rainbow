import { useEffect } from 'react';

import { analytics } from '@/analytics';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';

export const useAppIconIdentify = () => {
  const appIcon = useAppSettingsStore(s => s.appIcon);

  useEffect(() => {
    analytics.identify({ appIcon });
  }, [appIcon]);
};
