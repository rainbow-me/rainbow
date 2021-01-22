import React, { useCallback } from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
import { useExpandedStateNavigation } from '../../../hooks';
import SheetActionButton from './SheetActionButton';
import Routes from '@rainbow-me/routes';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

export default function SendActionButton({
  color = colors_NOT_REACTIVE.paleBlue,
  ...props
}) {
  const navigate = useExpandedStateNavigation();
  const handlePress = useCallback(
    () =>
      navigate(Routes.SEND_FLOW, params =>
        isNativeStackAvailable
          ? {
              params,
              screen: Routes.SEND_SHEET,
            }
          : { ...params }
      ),
    [navigate]
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
