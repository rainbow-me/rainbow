import React, { useCallback } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { Input } from '../inputs';
import { cloudBackupPasswordMinLength } from '@/handlers/cloudBackup';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import { Box } from '@/design-system';

const Container = styled(Box)({
  width: '100%',
});

const PasswordInput = styled(Input).attrs(({ theme: { colors } }) => ({
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

const ShadowContainer = styled(ShadowStack).attrs(
  ({ theme: { colors, isDarkMode } }) => ({
    backgroundColor: isDarkMode ? colors.offWhite : colors.white,
    borderRadius: 16,
    height: 46,
    shadows: [
      [0, 5, 15, colors.shadow, 0.06],
      [0, 10, 30, colors.shadow, 0.12],
    ],
    width: '100%',
  })
)({
  elevation: 15,
});

const PasswordField = (
  {
    password,
    returnKeyType = 'done',
    style,
    textContentType = 'password',
    ...props
  },
  ref
) => {
  const { width: deviceWidth } = useDimensions();
  const { isDarkMode } = useTheme();
  const handleFocus = useCallback(() => ref?.current?.focus(), [ref]);

  return (
    <Container onPress={ios ? handleFocus : undefined}>
      <ShadowContainer
        deviceWidth={deviceWidth}
        isDarkMode={isDarkMode}
        style={style}
      >
        <PasswordInput
          ref={ref}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          value={password}
          {...props}
        />
      </ShadowContainer>
    </Container>
  );
};

export default React.memo(React.forwardRef(PasswordField));
