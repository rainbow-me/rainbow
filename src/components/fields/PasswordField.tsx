import React, { forwardRef, useCallback, Ref } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { Input } from '../inputs';
import { cloudBackupPasswordMinLength } from '@/handlers/cloudBackup';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import { Box } from '@/design-system';
import { TextInput, TextInputProps } from 'react-native';

const Container = styled(Box)({
  width: '100%',
});

const PasswordInput = styled(Input).attrs(({ theme: { colors } }: any) => ({
  autoCompleteType: 'password',
  blurOnSubmit: false,
  passwordRules: `minlength: ${cloudBackupPasswordMinLength};`,
  placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.4),
  secureTextEntry: true,
  selectTextOnFocus: true,
  size: 'large',
  type: 'password',
  weight: 'semibold',
}))({
  ...padding.object(0, 40, 2.5, 19),
  height: '100%',
  width: '100%',
});

const ShadowContainer = styled(ShadowStack).attrs(({ theme: { colors, isDarkMode } }: any) => ({
  backgroundColor: isDarkMode ? colors.offWhite : colors.white,
  borderRadius: 16,
  height: 46,
  shadows: [
    [0, 5, 15, colors.shadow, 0.06],
    [0, 10, 30, colors.shadow, 0.12],
  ],
  width: '100%',
}))({
  elevation: 15,
});

interface PasswordFieldProps extends TextInputProps {
  password: string;
  returnKeyType?: 'done' | 'next';
  isInvalid?: boolean;
  isValid?: boolean;
}

const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  ({ password, returnKeyType = 'done', style, textContentType, ...props }, ref: Ref<TextInput>) => {
    const { width: deviceWidth } = useDimensions();
    const { isDarkMode } = useTheme();
    const handleFocus = useCallback(() => {
      if (typeof ref === 'function') {
        ref(null);
      } else if (ref) {
        ref.current?.focus();
      }
    }, [ref]);

    return (
      <Container onPress={ios ? handleFocus : undefined}>
        <ShadowContainer deviceWidth={deviceWidth} isDarkMode={isDarkMode} style={style}>
          <PasswordInput ref={ref} returnKeyType={returnKeyType} textContentType={textContentType} value={password} {...props} />
        </ShadowContainer>
      </Container>
    );
  }
);

PasswordField.displayName = 'PasswordField';

export default React.memo(PasswordField);
