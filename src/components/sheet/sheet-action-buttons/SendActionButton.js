import lang from 'i18n-js';
import React, { useCallback } from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function SendActionButton({ color: givenColor, ...props }) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
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
      label={`􀈠 ${lang.t('button.send')}`}
      onPress={handlePress}
      testID="send"
      weight="bold"
    />
  );
}
