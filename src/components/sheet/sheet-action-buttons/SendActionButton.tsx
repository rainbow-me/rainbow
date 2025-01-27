import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton, { SheetActionButtonProps } from './SheetActionButton';
import Routes from '@/navigation/routesNames';
import { Text } from '@/design-system';
import { colors } from '@/styles';
import { IS_IOS } from '@/env';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import { ParsedAddressAsset, RainbowToken, UniqueAsset } from '@/entities';

type SendActionButtonProps = SheetActionButtonProps & {
  asset: RainbowToken | UniqueAsset | ParsedAddressAsset;
};

function SendActionButton({ asset, color: givenColor, ...props }: SendActionButtonProps) {
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
    <SheetActionButton
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      color={color}
      newShadows
      onPress={handlePress}
      testID="send"
    >
      <Text align="center" color="label" size="20pt" weight="heavy">
        {lang.t('button.send')}
      </Text>
    </SheetActionButton>
  );
}

export default React.memo(SendActionButton);
