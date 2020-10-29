import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';

import SheetActionButton from './SheetActionButton';
import showWalletErrorAlert from '@rainbow-me/helpers/support';
import { useExpandedStateNavigation, useWallets } from '@rainbow-me/hooks';

import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

export default function BuyActionButton({ color = colors.paleBlue, ...props }) {
  const navigate = useExpandedStateNavigation();
  const { isDamaged } = useWallets();

  const handlePress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    navigate(Routes.ADD_CASH_FLOW, () =>
      isNativeStackAvailable
        ? {
            screen: Routes.ADD_CASH_SCREEN_NAVIGATOR,
          }
        : {
            screen: Routes.ADD_CASH_SHEET,
          }
    );
    analytics.track('Tapped Buy more ETH', {
      category: 'add cash',
    });
  }, [navigate, isDamaged]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label="Buy more ETH"
      onPress={handlePress}
      weight="bold"
    />
  );
}
