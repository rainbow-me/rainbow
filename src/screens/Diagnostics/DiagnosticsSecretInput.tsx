import { useTheme } from '@/theme';
import React, { useCallback } from 'react';
import { WrappedAlert as Alert } from '@/helpers/alert';
import i18n from '@/languages';
import Clipboard from '@react-native-clipboard/clipboard';
import { haptics } from '@/utils';
import { Row } from '@/components/layout';
import { TextInput } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Text } from '@/components/text';

export const DiagnosticsSecretInput = ({ value, color }: { value: string; color: string }) => {
  const { colors } = useTheme();
  const handleCopy = useCallback(() => {
    Alert.alert(i18n.wallet.diagnostics.secret.reminder_title(), i18n.wallet.diagnostics.secret.these_words_are_for_your_eyes_only(), [
      {
        onPress: () => {
          Clipboard.setString(value);
          haptics.notificationSuccess();
        },
        text: i18n.wallet.diagnostics.secret.okay_i_understand(),
      },
      {
        onPress: undefined,
        style: 'cancel',
        text: i18n.button.cancel(),
      },
    ]);
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
          style={{ paddingHorizontal: android ? 10 : 15, paddingVertical: 10 }}
          width="100%"
        >
          <Text align="center" color={colors.whiteLabel} weight="bold">
            {i18n.wallet.diagnostics.secret.copy_secret()}
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Row>
  );
};
