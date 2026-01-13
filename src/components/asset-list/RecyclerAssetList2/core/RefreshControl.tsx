import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import useRefreshAccountData from '@/hooks/useRefreshAccountData';
import { useTheme } from '@/theme';
import { navbarHeight } from '@/components/navbar/Navbar';
import { opacity } from '@/framework/ui/utils/opacity';

export default function RefreshControlWrapped(props: Partial<RefreshControlProps>) {
  const { refresh, isRefreshing } = useRefreshAccountData();
  const { colors } = useTheme();

  return (
    <RefreshControl
      {...props}
      onRefresh={refresh}
      progressViewOffset={navbarHeight + 16}
      refreshing={isRefreshing}
      tintColor={opacity(colors.blueGreyDark, 0.4)}
    />
  );
}
