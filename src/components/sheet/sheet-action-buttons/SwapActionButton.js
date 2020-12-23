import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useExpandedStateNavigation } from '../../../hooks';
import SheetActionButton from './SheetActionButton';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

export default function SwapActionButton({
  color = colors.swapPurple,
  inputType,
  isAvailable = true,
  ...props
}) {
  const navigate = useExpandedStateNavigation(inputType);
  const handlePress = useCallback(() => {
    if (!isAvailable) {
      Alert.alert(
        `You cannot swap this asset now. Pool hasn't been fetched yet or is not available.`
      );
      return;
    }
    navigate(Routes.EXCHANGE_MODAL, params => ({
      params: {
        params,
        screen: Routes.MAIN_EXCHANGE_SCREEN,
      },
      screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
    }));
  }, [navigate]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label="􀖅 Swap"
      onPress={handlePress}
      testID="swap"
      weight="bold"
    />
  );
}
