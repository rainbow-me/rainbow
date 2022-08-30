import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useSelector } from 'react-redux';
import { useRefreshAccountData } from '@/hooks';
import { AppState } from '@/redux/store';
import { useTheme } from '@/theme';

export default function RefreshControlWrapped(
  props: Partial<RefreshControlProps>
) {
  const isLoadingAssets = useSelector(
    (state: AppState) => state.data.isLoadingAssets
  );
  const { refresh, isRefreshing } = useRefreshAccountData();
  const { colors } = useTheme();
  const onRefresh = isLoadingAssets ? () => {} : refresh;

  return (
    <RefreshControl
      {...props}
      onRefresh={onRefresh}
      progressViewOffset={android ? 30 : 0}
      refreshing={isRefreshing}
      tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
    />
  );
}
