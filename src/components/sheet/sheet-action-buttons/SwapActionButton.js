import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

function SwapActionButton({
  color: givenColor,
  inputType,
  label,
  requireVerification,
  verified,
  weight = 'heavy',
  ...props
}) {
  const { colors } = useTheme();
  const color = givenColor || colors.swapPurple;

  const navigate = useExpandedStateNavigation(inputType);
  const goToSwap = useCallback(() => {
    navigate(Routes.EXCHANGE_MODAL, params => ({
      params: {
        params,
        screen: Routes.MAIN_EXCHANGE_SCREEN,
      },
      screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
    }));
  }, [navigate]);
  const handlePress = useCallback(() => {
    if (requireVerification && !verified) {
      Alert.alert(
        lang.t('exchange.unverified_token.unverified_token_title'),
        lang.t('exchange.unverified_token.token_not_verified'),
        [
          {
            onPress: goToSwap,
            text: lang.t('exchange.unverified_token.proceed_anyway'),
          },
          {
            style: 'cancel',
            text: lang.t('exchange.unverified_token.go_back'),
          },
        ]
      );
    } else {
      goToSwap();
    }
  }, [goToSwap, requireVerification, verified]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label={label || `􀖅 ${lang.t('button.swap')}`}
      onPress={handlePress}
      testID="swap"
      weight={weight}
    />
  );
}

export default React.memo(SwapActionButton);
