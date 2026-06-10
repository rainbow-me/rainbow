import React, { useCallback, useState } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

import { useForegroundColor } from '@/design-system';
import { refreshDiscover } from '@/features/discover/utils/refreshDiscover';

type DiscoverRefreshControlProps = Pick<RefreshControlProps, 'children' | 'style'>;

export function DiscoverRefreshControl({ children, style }: DiscoverRefreshControlProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tintColor = useForegroundColor('label');

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshDiscover();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <RefreshControl onRefresh={onRefresh} refreshing={isRefreshing} style={style} tintColor={tintColor}>
      {children}
    </RefreshControl>
  );
}
