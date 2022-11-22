import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useSelector } from 'react-redux';
import { useRefreshAccountData } from '@/hooks';
import { AppState } from '@/redux/store';
import { useTheme } from '@/theme';
import { navbarHeight } from '@/components/navbar/Navbar';

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
      progressViewOffset={navbarHeight + 16}
      refreshing={isRefreshing}
      tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
    />
  );
}
