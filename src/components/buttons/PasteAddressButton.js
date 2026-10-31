import React, { useCallback, useMemo } from 'react';

import { opacity } from '@/design-system/utils/opacity';
import { checkIsValidAddressOrDomainFormat } from '@/helpers/validators';
import useClipboard from '@/hooks/useClipboard';
import useInvalidPaste from '@/hooks/useInvalidPaste';
import * as i18n from '@/languages';
import { deviceUtils } from '@/utils/deviceUtils';

import { ButtonPressAnimation } from '../animations/ButtonPressAnimation';
import { Text } from '../text';

export default function PasteAddressButton({ onPress }) {
  const { colors } = useTheme();
  const { onInvalidPaste } = useInvalidPaste();
  const { clipboard, enablePaste, getClipboard, hasClipboardData } = useClipboard();

  const isValid = useMemo(() => checkIsValidAddressOrDomainFormat(clipboard), [clipboard]);

  const handlePress = useCallback(() => {
    if (!enablePaste) return;

    getClipboard(clipboardData => {
      const isValidAddress = checkIsValidAddressOrDomainFormat(clipboardData);

      if (isValidAddress) {
        return onPress?.(clipboardData);
      }

      return onInvalidPaste();
    });
  }, [enablePaste, getClipboard, onInvalidPaste, onPress]);

  return (deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid) ? null : (
    <ButtonPressAnimation onPress={handlePress} testID="paste-address-button">
      <Text
        align="right"
        color={(deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid) ? opacity(colors.blueGreyDark, 0.3) : colors.appleBlue}
        size="large"
        weight="heavy"
      >
        􀜍 {i18n.t(i18n.l.button.paste_address)}
      </Text>
    </ButtonPressAnimation>
  );
}
