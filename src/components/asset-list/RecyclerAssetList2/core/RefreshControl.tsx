import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useRefreshAccountData } from '@/hooks';
import { useTheme } from '@/theme';
import { navbarHeight } from '@/components/navbar/Navbar';

export default function RefreshControlWrapped(props: Partial<RefreshControlProps>) {
  const { refresh, isRefreshing } = useRefreshAccountData();
  const { colors } = useTheme();

  return (
    <RefreshControl
      {...props}
      onRefresh={refresh}
      progressViewOffset={navbarHeight + 16}
      refreshing={isRefreshing}
      tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
    />
  );
}
