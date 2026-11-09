import React from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

import { navbarHeight } from '@/components/navbar/Navbar';
import { opacity } from '@/design-system/utils/opacity';
import { accountRefreshActions, useAccountRefreshStore } from '@/features/wallet/data/walletRefreshStore';
import { useTheme } from '@/theme/ThemeContext';

export function RefreshControlWrapped(props: Partial<RefreshControlProps>) {
  const isRefreshing = useAccountRefreshStore(state => state.isRefreshing);
  const { colors } = useTheme();

  return (
    <RefreshControl
      {...props}
      onRefresh={accountRefreshActions.refreshAccountData}
      progressViewOffset={navbarHeight + 16}
      refreshing={isRefreshing}
      tintColor={opacity(colors.blueGreyDark, 0.4)}
    />
  );
}
