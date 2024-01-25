import React, { useCallback } from 'react';
import { View } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { cloudBackupPasswordMinLength } from '@/handlers/cloudBackup';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';

const FieldAccessoryBadgeSize = 16;
const FieldAccessoryBadgeWrapper = styled(ShadowStack).attrs(
  ({ theme: { colors, isDarkMode }, color }) => ({
    ...position.sizeAsObject(FieldAccessoryBadgeSize),
    borderRadius: FieldAccessoryBadgeSize,
    shadows: [
      [0, 4, 12, isDarkMode ? colors.shadow : color, isDarkMode ? 0.1 : 0.4],
    ],
  })
)({
  marginBottom: 12,
  position: 'absolute',
  right: 12,
  top: 12,
});

const Container = styled(ios ? TouchableWithoutFeedback : View)(
  android
    ? {
        marginTop: -30,
        padding: 30,
      }
    : {
        marginLeft: 24,
      }
);

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
});

const ShadowContainer = styled(ShadowStack).attrs(
  ({ deviceWidth, theme: { colors, isDarkMode } }) => ({
    backgroundColor: isDarkMode ? colors.offWhite : colors.white,
    borderRadius: 16,
    height: 46,
    shadows: [
      [0, 5, 15, colors.shadow, 0.06],
      [0, 10, 30, colors.shadow, 0.12],
    ],
    width: Math.max(deviceWidth - 130, 245),
  })
)({
  elevation: 15,
});

function FieldAccessoryBadge({ color, name }) {
  return (
    <FieldAccessoryBadgeWrapper color={color}>
      <Icon color={color} name={name} size={FieldAccessoryBadgeSize} />
    </FieldAccessoryBadgeWrapper>
  );
}

const PasswordField = (
  {
    isInvalid,
    isValid,
    password,
    returnKeyType = 'done',
    style,
    textContentType = 'password',
    ...props
  },
  ref
) => {
  const { width: deviceWidth } = useDimensions();
  const { isDarkMode, colors } = useTheme();
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
        {isValid && (
          <FieldAccessoryBadge color={colors.green} name="checkmarkCircled" />
        )}
        {isInvalid && (
          <FieldAccessoryBadge
            color={colors.orangeLight}
            name="warningCircled"
          />
        )}
      </ShadowContainer>
    </Container>
  );
};

export default React.memo(React.forwardRef(PasswordField));
