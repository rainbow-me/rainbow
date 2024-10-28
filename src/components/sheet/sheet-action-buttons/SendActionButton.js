import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import Routes from '@/navigation/routesNames';
import { IS_IOS } from '@/env';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';

function SendActionButton({ asset, color: givenColor, ...props }) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();
  const handlePress = useCallback(
    () =>
      navigate(Routes.SEND_FLOW, {
        asset,
        ...(IS_IOS ? { screen: Routes.SEND_SHEET, params: { asset } } : {}),
      }),
    [navigate, asset]
  );

  return (
    <SheetActionButton {...props} color={color} label={`􀈠 ${lang.t('button.send')}`} onPress={handlePress} testID="send" weight="heavy" />
  );
}

export default React.memo(SendActionButton);
