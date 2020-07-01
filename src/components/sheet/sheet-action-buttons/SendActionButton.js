import React, { useCallback } from 'react';
import { useExpandedStateNavigation } from '../../../hooks';
import SheetActionButton from './SheetActionButton';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

export default function SendActionButton(props) {
  const navigate = useExpandedStateNavigation();
  const handlePress = useCallback(
    () =>
      navigate(Routes.SEND_SHEET_NAVIGATOR, params => ({
        params,
        screen: Routes.SEND_SHEET,
      })),
    [navigate]
  );

  return (
    <SheetActionButton
      {...props}
      color={colors.paleBlue}
      label="􀈠 Send"
      onPress={handlePress}
    />
  );
}
