import React from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

import { navbarHeight } from '@/components/navbar/Navbar';
import { opacity } from '@/framework/ui/utils/opacity';
import useRefreshAccountData from '@/hooks/useRefreshAccountData';
import { useTheme } from '@/theme/ThemeContext';

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
