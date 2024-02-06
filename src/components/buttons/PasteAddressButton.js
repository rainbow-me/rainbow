import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import { checkIsValidAddressOrDomain } from '@/helpers/validators';
import { useClipboard, useInvalidPaste } from '@/hooks';
import { deviceUtils } from '@/utils';

export default function PasteAddressButton({ onPress }) {
  const [isValid, setIsValid] = useState(false);
  const { colors } = useTheme();
  const { onInvalidPaste } = useInvalidPaste();
  const { clipboard, enablePaste, getClipboard, hasClipboardData } = useClipboard();

  useEffect(() => {
    async function validate() {
      const isValidAddress = await checkIsValidAddressOrDomain(clipboard);
      setIsValid(isValidAddress);
    }

    if (!deviceUtils.isIOS14) {
      validate();
    }
  }, [clipboard]);

  const handlePress = useCallback(() => {
    if (!enablePaste) return;

    getClipboard(async clipboardData => {
      const isValidAddress = await checkIsValidAddressOrDomain(clipboardData);

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
        color={
          (deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid) ? colors.alpha(colors.blueGreyDark, 0.3) : colors.appleBlue
        }
        size="large"
        weight="heavy"
      >
        􀜍 {lang.t('button.paste_address')}
      </Text>
    </ButtonPressAnimation>
  );
}
