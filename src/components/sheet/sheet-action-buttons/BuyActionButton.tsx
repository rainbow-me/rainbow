import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton, { SheetActionButtonProps } from './SheetActionButton';
import { analyticsV2 } from '@/analytics';
import { Text } from '@/design-system';
import showWalletErrorAlert from '@/helpers/support';
import { useWallets } from '@/hooks';

import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { useRoute } from '@react-navigation/native';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';

type BuyActionButtonProps = SheetActionButtonProps;

function BuyActionButton({ color: givenColor, ...props }: BuyActionButtonProps) {
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
    <SheetActionButton
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      color={color}
      newShadows
      onPress={handlePress}
    >
      <Text align="center" color="label" size="20pt" weight="heavy">
        {`􀍰 ${lang.t('button.buy_eth')}`}
      </Text>
    </SheetActionButton>
  );
}

export default React.memo(BuyActionButton);
