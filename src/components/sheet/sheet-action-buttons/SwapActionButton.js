import React, { useCallback } from 'react';
import { useExpandedStateNavigation } from '../../../hooks';
import Routes from '../../../navigation/routesNames';
import { colors } from '../../../styles';
import SheetActionButton from './SheetActionButton';

export default function SwapActionButton({ inputType, ...props }) {
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
      color={colors.swapPurple}
      label="􀖅 Swap"
      onPress={handlePress}
    />
  );
}
