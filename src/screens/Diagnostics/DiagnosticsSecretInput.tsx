import React, { useCallback } from 'react';
import { Platform, TextInput } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import { triggerHaptics } from 'react-native-turbo-haptics';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Row } from '@/components/layout';
import { Text } from '@/components/text';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { useTheme } from '@/theme/ThemeContext';

export const DiagnosticsSecretInput = ({ value, color }: { value: string; color: string }) => {
  const { colors } = useTheme();
  const handleCopy = useCallback(() => {
    Alert.alert(
      i18n.t(i18n.l.wallet.diagnostics.secret.reminder_title),
      i18n.t(i18n.l.wallet.diagnostics.secret.these_words_are_for_your_eyes_only),
      [
        {
          onPress: () => {
            Clipboard.setString(value);
            triggerHaptics('notificationSuccess');
          },
          text: i18n.t(i18n.l.wallet.diagnostics.secret.okay_i_understand),
        },
        {
          onPress: undefined,
          style: 'cancel',
          text: i18n.t(i18n.l.button.cancel),
        },
      ]
    );
  }, [value]);
  return (
    <Row justify="space-between" width="100%">
      <TextInput
        // @ts-expect-error probably a valid prop but not typed properly
        disabled
        editable={false}
        secureTextEntry
        selectTextOnFocus
        style={{ width: '65%', color }}
        value={value}
      />
      <ButtonPressAnimation onPress={handleCopy}>
        <Row
          backgroundColor={colors.appleBlue}
          borderRadius={15}
          style={{ paddingHorizontal: Platform.OS === 'android' ? 10 : 15, paddingVertical: 10 }}
          width="100%"
        >
          <Text align="center" color={colors.whiteLabel} weight="bold">
            {i18n.t(i18n.l.wallet.diagnostics.secret.copy_secret)}
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Row>
  );
};
