import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { useForegroundColor } from '@/design-system';
import { refreshDiscoverSurface } from '@/features/discover/utils/refreshDiscoverSurface';

export function DiscoverRefreshControl() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tintColor = useForegroundColor('label');

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshDiscoverSurface('discover');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return <RefreshControl onRefresh={onRefresh} refreshing={isRefreshing} tintColor={tintColor} />;
}
