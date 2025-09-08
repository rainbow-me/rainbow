import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import SheetActionButton, { SheetActionButtonProps } from './SheetActionButton';
import { analytics } from '@/analytics';
import { Text } from '@/design-system';
import showWalletErrorAlert from '@/helpers/support';
import { getIsDamagedWallet } from '@/state/wallets/walletsStore';

import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { useRoute } from '@react-navigation/native';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';

type BuyActionButtonProps = SheetActionButtonProps;

function BuyActionButton({ color: givenColor, ...props }: BuyActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();
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
        {`􀍰 ${i18n.t(i18n.l.button.buy_eth)}`}
      </Text>
    </SheetActionButton>
  );
}

export default React.memo(BuyActionButton);
