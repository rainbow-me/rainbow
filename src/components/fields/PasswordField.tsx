import React, { forwardRef, useCallback, type Ref } from 'react';
import { View, type TextInput, type TextInputProps } from 'react-native';

import { Box } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import styled from '@/framework/ui/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';
import { cloudBackupPasswordMinLength } from '@/handlers/cloudBackup';
import useDimensions from '@/hooks/useDimensions';
import ShadowStack from '@/react-native-shadow-stack';
import { padding, position } from '@/styles';

import { useTheme, type ThemeContextProps } from '../../theme/ThemeContext';
import { Icon } from '../icons';
import { Input } from '../inputs';

const FieldAccessoryBadgeSize = 22;
const FieldAccessoryBadgeWrapper = styled(ShadowStack).attrs(
  ({ theme: { colors, isDarkMode }, color }: { theme: ThemeContextProps; color: string }) => ({
    ...position.sizeAsObject(FieldAccessoryBadgeSize),
    borderRadius: FieldAccessoryBadgeSize,
    shadows: [[0, 4, 12, isDarkMode ? colors.shadow : color, isDarkMode ? 0.1 : 0.4]],
  })
)({
  marginBottom: 12,
  position: 'absolute',
  right: 12,
  top: 12,
});

function FieldAccessoryBadge({ color, name }: { color: string; name: string }) {
  return (
    <FieldAccessoryBadgeWrapper color={color}>
      <Icon color={color} name={name} size={FieldAccessoryBadgeSize} />
    </FieldAccessoryBadgeWrapper>
  );
}

const Container = styled(Box)({
  width: '100%',
});

const PasswordInput = styled(Input).attrs(({ theme: { colors } }: any) => ({
  autoCompleteType: 'password',
  blurOnSubmit: false,
  passwordRules: `minlength: ${cloudBackupPasswordMinLength};`,
  placeholderTextColor: opacity(colors.blueGreyDark, 0.4),
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

// Use styled-components attrs for dynamic props to ensure they are memoized
const ShadowContainer = styled(IS_IOS ? ShadowStack : View).attrs(({ theme: { colors, isDarkMode }, deviceWidth }: any) => {
  return {
    backgroundColor: isDarkMode ? colors.offWhite : colors.white,
    borderRadius: 16,
    height: 46,
    shadows: [
      [0, 5, 15, colors.shadow, 0.06],
      [0, 10, 30, colors.shadow, 0.12],
    ],
    width: IS_ANDROID ? deviceWidth - 48 : '100%',
    elevation: 15,
  };
})({});

interface PasswordFieldProps extends TextInputProps {
  password: string;
  returnKeyType?: 'done' | 'next';
  isInvalid?: boolean;
  isValid?: boolean;
}

const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  ({ password, isInvalid, returnKeyType = 'done', style, textContentType, ...props }, ref: Ref<TextInput>) => {
    const { width: deviceWidth } = useDimensions();
    const { isDarkMode, colors } = useTheme();

    const handleFocus = useCallback(() => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.focus();
      }
    }, [ref]);

    return (
      <Container onPress={handleFocus}>
        <ShadowContainer deviceWidth={deviceWidth} isDarkMode={isDarkMode} style={style}>
          <PasswordInput ref={ref} returnKeyType={returnKeyType} textContentType={textContentType} value={password} {...props} />
          {isInvalid && <FieldAccessoryBadge color={colors.red} name="warningCircled" />}
        </ShadowContainer>
      </Container>
    );
  }
);

PasswordField.displayName = 'PasswordField';

export default React.memo(PasswordField);
