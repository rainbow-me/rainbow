import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useSelector } from 'react-redux';
import { useRefreshAccountData } from '@rainbow-me/hooks';
import { AppState } from '@rainbow-me/redux/store';
import { useTheme } from '@rainbow-me/theme';

export default function RefreshControlWrapped(
  props: Partial<RefreshControlProps>
) {
  const isLoadingAssets = useSelector(
    (state: AppState) => state.data.isLoadingAssets
  );
  const { refresh, isRefreshing } = useRefreshAccountData();
  const { colors } = useTheme();

  return isLoadingAssets ? null : (
    <RefreshControl
      {...props}
      onRefresh={refresh}
      progressViewOffset={android ? 30 : 0}
      refreshing={isRefreshing}
      tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
    />
  );
}
