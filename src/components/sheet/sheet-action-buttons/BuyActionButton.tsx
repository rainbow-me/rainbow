import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton, { SheetActionButtonProps } from './SheetActionButton';
import { analytics } from '@/analytics';
import { Text } from '@/design-system';
import showWalletErrorAlert from '@/helpers/support';
<<<<<<< HEAD
import { getIsDamagedWallet } from '@/state/wallets/walletsStore';
=======
import { useIsDamagedWallet } from '@/state/wallets/walletsStore';
>>>>>>> origin/develop

import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { useRoute } from '@react-navigation/native';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';

type BuyActionButtonProps = SheetActionButtonProps;

function BuyActionButton({ color: givenColor, ...props }: BuyActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();
<<<<<<< HEAD
=======
  const isDamaged = useIsDamagedWallet();
>>>>>>> origin/develop
  const { name: routeName } = useRoute();

  const handlePress = useCallback(() => {
    if (getIsDamagedWallet()) {
      showWalletErrorAlert();
      return;
    }

    navigate(Routes.ADD_CASH_SHEET);

    analytics.track(analytics.event.buyButtonPressed, {
      componentName: 'BuyActionButton',
      routeName,
    });
  }, [navigate, routeName]);

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
