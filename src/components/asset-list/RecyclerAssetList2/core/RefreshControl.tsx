import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@rainbow-me/context';
import { useRefreshAccountData } from '@rainbow-me/hooks';
import { AppState } from '@rainbow-me/redux/store';
import { logger } from '@rainbow-me/utils';

export default function RefreshControlWrapped() {
  const isLoadingAssets = useSelector(
    (state: AppState) => state.data.isLoadingAssets
  );

  const refreshAccountData = useRefreshAccountData();
  const { colors } = useTheme();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshAccountData();
    } catch (e) {
      logger.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, [setIsRefreshing, refreshAccountData]);

  return isLoadingAssets ? null : (
    <RefreshControl
      onRefresh={handleRefresh}
      progressViewOffset={android ? 30 : 0}
      refreshing={isRefreshing}
      tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
    />
  );
}
