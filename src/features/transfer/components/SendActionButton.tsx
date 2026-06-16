import React, { useCallback } from 'react';
import { Platform } from 'react-native';

import SheetActionButton, { type SheetActionButtonProps } from '@/components/sheet/sheet-action-buttons/SheetActionButton';
import { Text } from '@/design-system';
import type { ParsedAddressAsset, RainbowToken } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';

type SendActionButtonProps = SheetActionButtonProps & {
  asset: RainbowToken | UniqueAsset | ParsedAddressAsset;
};

function SendActionButton({ asset, color: givenColor, textColor, ...props }: SendActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
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
