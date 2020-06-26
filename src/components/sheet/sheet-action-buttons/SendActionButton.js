import React, { useCallback } from 'react';
import { useExpandedStateNavigation } from '../../../hooks';
import Routes from '../../../navigation/routesNames';
import { colors } from '../../../styles';
import SheetActionButton from './SheetActionButton';

export default function SendActionButton({
  color = colors.paleBlue,
  ...props
}) {
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
      color={color}
      label="􀈠 Send"
      onPress={handlePress}
    />
  );
}
