import React, { useCallback } from 'react';
import { Alert } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SheetActionButton' was resolved to '/Use... Remove this comment to see the full error message
import SheetActionButton from './SheetActionButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useExpandedStateNavigation } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

export default function SwapActionButton({
  color: givenColor,
  inputType,
  label,
  requireVerification,
  verified,
  weight = 'heavy',
  ...props
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const color = givenColor || colors.swapPurple;
  const navigate = useExpandedStateNavigation(inputType);
  const goToSwap = useCallback(() => {
    navigate(Routes.EXCHANGE_MODAL, (params: any) => ({
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
