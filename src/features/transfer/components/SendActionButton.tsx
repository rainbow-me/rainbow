import React, { useCallback } from 'react';
import { Platform } from 'react-native';

import type { ParsedSearchAsset } from '@/__swaps__/types/assets';
import SheetActionButton, { type SheetActionButtonProps } from '@/components/sheet/sheet-action-buttons/SheetActionButton';
import { Text, TextIcon } from '@/design-system';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { parsedSearchAssetToParsedAddressAsset } from '@/state/assets/utils';
import { colors } from '@/styles';

type SendActionButtonProps = Omit<SheetActionButtonProps, 'icon'> & {
  asset: ParsedSearchAsset | UniqueAsset;
  /** SF Symbol glyph rendered in place of the "Send" label, for icon-only buttons. */
  icon?: string;
};

function SendActionButtonComponent({ asset, color: givenColor, icon, size, textColor, ...props }: SendActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const navigate = useNavigationForNonReadOnlyWallets();

  const handlePress = useCallback(() => {
    const sendAsset = 'contractAddress' in asset ? asset : parsedSearchAssetToParsedAddressAsset(asset);

    if (Platform.OS === 'ios') {
      navigate(Routes.SEND_FLOW, { screen: Routes.SEND_SHEET, params: { asset: sendAsset } });
    } else {
      navigate(Routes.SEND_FLOW, { asset: sendAsset });
    }
  }, [asset, navigate]);

  return (
    <SheetActionButton
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      color={color}
      newShadows
      onPress={handlePress}
      size={size}
      testID="send"
    >
      {icon ? (
        <TextIcon
          color={textColor ? { custom: textColor } : 'label'}
          containerSize={typeof size === 'number' ? size : undefined}
          size="icon 20px"
          weight="heavy"
        >
          {icon}
        </TextIcon>
      ) : (
        <Text align="center" color={textColor ? { custom: textColor } : 'label'} size="20pt" weight="heavy">
          {i18n.t(i18n.l.button.send)}
        </Text>
      )}
    </SheetActionButton>
  );
}

export const SendActionButton = React.memo(SendActionButtonComponent);
