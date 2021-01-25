import React, { useCallback } from 'react';
import { useExpandedStateNavigation } from '../../../hooks';
import SheetActionButton from './SheetActionButton';
import Routes from '@rainbow-me/routes';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

export default function SwapActionButton({
  color = colors_NOT_REACTIVE.swapPurple,
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
