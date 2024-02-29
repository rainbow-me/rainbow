import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { IS_IOS } from '@/env';

function SendActionButton({ asset, color: givenColor, ...props }) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useExpandedStateNavigation(null, false, asset);
  const handlePress = useCallback(
    () =>
      navigate(Routes.SEND_FLOW, params => {
        const updatedParams = { ...params, asset };
        return IS_IOS
          ? {
              params: updatedParams,
              screen: Routes.SEND_SHEET,
            }
          : { ...updatedParams };
      }),
    [navigate, asset]
  );

  return (
    <SheetActionButton {...props} color={color} label={`􀈠 ${lang.t('button.send')}`} onPress={handlePress} testID="send" weight="heavy" />
  );
}

export default React.memo(SendActionButton);
