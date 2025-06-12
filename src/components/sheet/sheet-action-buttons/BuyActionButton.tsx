import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton, { SheetActionButtonProps } from './SheetActionButton';
import { analytics } from '@/analytics';
import { Text } from '@/design-system';
import showWalletErrorAlert from '@/helpers/support';
import { useIsDamagedWallet } from '@/state/wallets/walletsStore';

import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { useRoute } from '@react-navigation/native';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';

type BuyActionButtonProps = SheetActionButtonProps;

function BuyActionButton({ color: givenColor, ...props }: BuyActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();
  const isDamaged = useIsDamagedWallet();
  const { name: routeName } = useRoute();

  const handlePress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    navigate(Routes.ADD_CASH_SHEET);

    analytics.track(analytics.event.buyButtonPressed, {
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
