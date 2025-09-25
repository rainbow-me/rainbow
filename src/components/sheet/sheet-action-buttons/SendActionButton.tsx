import * as i18n from '@/languages';
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

function SendActionButton({ asset, color: givenColor, textColor, ...props }: SendActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();

  const handlePress = useCallback(() => {
    if (IS_IOS) {
      navigate(Routes.SEND_FLOW, { screen: Routes.SEND_SHEET, params: { asset } });
    } else {
      navigate(Routes.SEND_FLOW, { asset });
    }
  }, [asset, navigate]);

  return (
    <SheetActionButton
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      color={color}
      newShadows
      onPress={handlePress}
      testID="send"
    >
      <Text align="center" color={textColor ? { custom: textColor } : 'label'} size="20pt" weight="heavy">
        {i18n.t(i18n.l.button.send)}
      </Text>
    </SheetActionButton>
  );
}

export default React.memo(SendActionButton);
