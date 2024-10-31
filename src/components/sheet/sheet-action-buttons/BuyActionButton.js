import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { analyticsV2 } from '@/analytics';
import showWalletErrorAlert from '@/helpers/support';
import { useWallets } from '@/hooks';

import Routes from '@/navigation/routesNames';
import { useRoute } from '@react-navigation/native';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';

function BuyActionButton({ color: givenColor, ...props }) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();
  const { isDamaged } = useWallets();
  const { name: routeName } = useRoute();

  const handlePress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    navigate(Routes.ADD_CASH_SHEET);

    analyticsV2.track(analyticsV2.event.buyButtonPressed, {
      componentName: 'BuyActionButton',
      routeName,
    });
  }, [isDamaged, navigate, routeName]);

  return <SheetActionButton {...props} color={color} label={`􀍰 ${lang.t('button.buy_eth')}`} onPress={handlePress} weight="bold" />;
}

export default React.memo(BuyActionButton);
