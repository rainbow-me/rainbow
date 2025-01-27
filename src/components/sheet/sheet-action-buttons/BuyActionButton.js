import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { analyticsV2 } from '@/analytics';
import { Text } from '@/design-system';
import showWalletErrorAlert from '@/helpers/support';
import { useWallets } from '@/hooks';

import Routes from '@/navigation/routesNames';
import { useRoute } from '@react-navigation/native';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';

function BuyActionButton({ color: givenColor, height, ...props }) {
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

  return (
    <SheetActionButton {...props} color={color} newShadows onPress={handlePress} size={height}>
      <Text align="center" color="label" size="20pt" weight="heavy">
        {`􀍰 ${lang.t('button.buy_eth')}`}
      </Text>
    </SheetActionButton>
  );
}

export default React.memo(BuyActionButton);
