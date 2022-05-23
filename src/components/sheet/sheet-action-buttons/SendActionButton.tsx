import lang from 'i18n-js';
import React, { useCallback } from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
import SheetActionButton from './SheetActionButton';
import { useTheme } from '@rainbow-me/context';
import { UniqueAsset } from '@rainbow-me/entities';
import { useExpandedStateNavigation } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

function SendActionButton({
  asset,
  color: givenColor,
  ...props
}: {
  asset: UniqueAsset;
  color?: string;
}) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useExpandedStateNavigation();
  const handlePress = useCallback(() => {
    navigate(Routes.SEND_FLOW, (params: any) => {
      const updatedParams = { ...params, asset };
      return isNativeStackAvailable
        ? {
            params: updatedParams,
            screen: Routes.SEND_SHEET,
          }
        : { ...updatedParams };
    });
  }, [navigate, asset]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      // @ts-expect-error JavaScript component
      label={`􀈠 ${lang.t('button.send')}`}
      onPress={handlePress}
      // @ts-expect-error JavaScript component
      testID="send"
      weight="heavy"
    />
  );
}

export default React.memo(SendActionButton);
