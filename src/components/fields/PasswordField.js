import React, { useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { cloudBackupPasswordMinLength } from '@rainbow-me/handlers/cloudBackup';
import { useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const FieldAccessoryBadgeSize = 22;
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

const StyledTouchable = styled(TouchableWithoutFeedback)(
  android
    ? {
        marginTop: -30,
        padding: 30,
      }
    : {}
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
    borderRadius: 23,
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
  const handleFocus = useCallback(() => ref?.current?.focus?.(), [ref]);
  const { isDarkMode, colors } = useTheme();

  return (
    <StyledTouchable onPress={handleFocus}>
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
    </StyledTouchable>
  );
};

export default React.forwardRef(PasswordField);
