import React, { useCallback } from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function SendActionButton({
  asset,
  color: givenColor,
  ...props
}) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useExpandedStateNavigation();
  const handlePress = useCallback(
    () =>
      navigate(Routes.SEND_FLOW, params => {
        const updatedParams = { ...params, asset };
        return isNativeStackAvailable
          ? {
              params: updatedParams,
              screen: Routes.SEND_SHEET,
            }
          : { ...updatedParams };
      }),
    [navigate, asset]
  );

  return (
    <SheetActionButton
      {...props}
      color={color}
      label="􀈠 Send"
      onPress={handlePress}
      testID="send"
      weight="bold"
    />
  );
}
