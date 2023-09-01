import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import Routes from '@/navigation/routesNames';
import { IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';

function SendActionButton({ asset, color: givenColor, ...props }) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const { navigate, goBack } = useNavigation();
  const handlePress = useCallback(() => {
    goBack();
    navigate(Routes.SEND_SHEET, {
      asset,
    });
  }, [navigate, asset, goBack]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label={`􀈠 ${lang.t('button.send')}`}
      onPress={handlePress}
      testID="send"
      weight="heavy"
    />
  );
}

export default React.memo(SendActionButton);
