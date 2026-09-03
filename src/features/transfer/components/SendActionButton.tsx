import React from 'react';

import SheetActionButton, { type SheetActionButtonProps } from '@/components/sheet/sheet-action-buttons/SheetActionButton';
import { Text, TextIcon } from '@/design-system';
import type { ParsedAddressAsset, RainbowToken } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { useNavigateToSend } from '@/features/transfer/hooks/useNavigateToSend';
import * as i18n from '@/languages';
import { colors } from '@/styles';

type SendActionButtonProps = Omit<SheetActionButtonProps, 'icon'> & {
  asset: RainbowToken | UniqueAsset | ParsedAddressAsset;
  /** SF Symbol glyph rendered in place of the "Send" label, for icon-only buttons. */
  icon?: string;
};

function SendActionButtonComponent({ asset, color: givenColor, icon, size, textColor, ...props }: SendActionButtonProps) {
  const color = givenColor || colors.paleBlue;
  const handlePress = useNavigateToSend(asset);

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
