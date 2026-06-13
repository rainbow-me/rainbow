import React, { useCallback } from 'react';

import { useRoute } from '@react-navigation/native';

import { analytics } from '@/analytics';
import { Text } from '@/design-system';
import { useIsCashEnabled } from '@/features/cash/hooks/useIsCashEnabled';
import { getAddCashRoute } from '@/features/cash/navigation/getAddCashRoute';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { getIsDamagedWallet } from '@/state/wallets/walletsStore';
import { colors } from '@/styles';

import SheetActionButton, { type SheetActionButtonProps } from './SheetActionButton';

type BuyActionButtonProps = SheetActionButtonProps;

function BuyActionButton({ color: givenColor, ...props }: BuyActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();
  const { name: routeName } = useRoute();
  const isCashEnabled = useIsCashEnabled();

  const handlePress = useCallback(() => {
    if (getIsDamagedWallet()) {
      navigate(Routes.WALLET_ERROR_SHEET);
      return;
    }

    navigate(getAddCashRoute(isCashEnabled));

    analytics.track(analytics.event.buyButtonPressed, {
      componentName: 'BuyActionButton',
      routeName,
    });
  }, [isCashEnabled, navigate, routeName]);

  return (
    <SheetActionButton
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      color={color}
      newShadows
      onPress={handlePress}
    >
      <Text align="center" color="label" size="20pt" weight="heavy">
        {`􀍰 ${isCashEnabled ? i18n.t(i18n.l.cash.add_cash) : i18n.t(i18n.l.button.buy_eth)}`}
      </Text>
    </SheetActionButton>
  );
}

export default React.memo(BuyActionButton);
