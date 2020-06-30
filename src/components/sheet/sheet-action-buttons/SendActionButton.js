import React, { useCallback } from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
import { useExpandedStateNavigation } from '../../../hooks';
import Routes from '../../../navigation/routesNames';
import { colors } from '../../../styles';
import SheetActionButton from './SheetActionButton';

export default function SendActionButton(props) {
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
      color={colors.paleBlue}
      label="􀈠 Send"
      onPress={handlePress}
    />
  );
}
