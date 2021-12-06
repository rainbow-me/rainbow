import React, { useCallback, useEffect, useState } from 'react';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useClipboard, useInvalidPaste } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils } from '@rainbow-me/utils';

export default function PasteAddressButton({ onPress }: any) {
  const [isValid, setIsValid] = useState(false);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { onInvalidPaste } = useInvalidPaste();
  const {
    clipboard,
    enablePaste,
    getClipboard,
    hasClipboardData,
  } = useClipboard();

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

    getClipboard(async (clipboardData: any) => {
      const isValidAddress = await checkIsValidAddressOrDomain(clipboardData);

      if (isValidAddress) {
        return onPress?.(clipboardData);
      }

      return onInvalidPaste();
    });
  }, [enablePaste, getClipboard, onInvalidPaste, onPress]);

  return (
    deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid
  ) ? null : (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={handlePress} testID="paste-address-button">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        align="right"
        color={
          (deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid)
            ? colors.alpha(colors.blueGreyDark, 0.3)
            : colors.appleBlue
        }
        size="large"
        weight="heavy"
      >
        􀜍 Paste
      </Text>
    </ButtonPressAnimation>
  );
}
