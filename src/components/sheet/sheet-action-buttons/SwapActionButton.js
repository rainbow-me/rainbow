import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function SwapActionButton({
  color: givenColor,
  inputType,
  label,
  requireVerification,
  verified,
  weight = 'bold',
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
        `Unverified Token`,
        'This token has not been verified! Rainbow surfaces all tokens that exist on Uniswap. Anyone can create a token, including fake versions of existing tokens and tokens that claim to represent projects that do not have a token. Please do your own research and be careful when interacting with unverified tokens!',
        [
          {
            onPress: goToSwap,
            text: `Proceed Anyway`,
          },
          {
            style: 'cancel',
            text: 'Go Back',
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
      label={label || '􀖅 Swap'}
      onPress={handlePress}
      testID="swap"
      weight={weight}
    />
  );
}
