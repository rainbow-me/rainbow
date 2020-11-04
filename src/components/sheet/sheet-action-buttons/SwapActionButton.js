import React, { useCallback } from 'react';
import { useExpandedStateNavigation } from '../../../hooks';
import SheetActionButton from './SheetActionButton';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

export default function SwapActionButton({
  color = colors.swapPurple,
  inputType,
  ...props
}) {
  const navigate = useExpandedStateNavigation(inputType);
  const handlePress = useCallback(
    () =>
      navigate(Routes.EXCHANGE_MODAL, params => ({
        params: {
          params,
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        },
        screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
      })),
    [navigate]
  );

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
