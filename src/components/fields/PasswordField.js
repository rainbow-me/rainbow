import React, { useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { cloudBackupPasswordMinLength } from '@rainbow-me/handlers/cloudBackup';
import { useDimensions } from '@rainbow-me/hooks';
import { colors, padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const FieldAccessoryBadgeSize = 22;
const FieldAccessoryBadgeWrapper = styled(ShadowStack).attrs(({ color }) => ({
  ...position.sizeAsObject(FieldAccessoryBadgeSize),
  borderRadius: FieldAccessoryBadgeSize,
  shadows: [[0, 4, 12, color, 0.4]],
}))`
  margin-bottom: 12;
  position: absolute;
  right: 12;
  top: 12;
`;

const StyledTouchable = styled(TouchableWithoutFeedback)`
  ${android ? 'padding-left: 30;' : ''}
  ${android ? 'padding-right: 30;' : ''}
  ${android ? 'padding-top: 30;' : ''}
  ${android ? 'padding-bottom: 30;' : ''}
  ${android ? 'margin-top: -30;' : ''}
`;

const PasswordInput = styled(Input).attrs({
  autoCompleteType: 'password',
  blurOnSubmit: false,
  passwordRules: `minlength: ${cloudBackupPasswordMinLength};`,
  placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.4),
  secureTextEntry: true,
  selectTextOnFocus: true,
  size: 'large',
  type: 'password',
  weight: 'semibold',
})`
  ${padding(0, 40, 2.5, 19)};
  height: 100%;
`;

const ShadowContainer = styled(ShadowStack).attrs(({ deviceWidth }) => ({
  borderRadius: 23,
  height: 46,
  shadows: [
    [0, 5, 15, colors.dark, 0.06],
    [0, 10, 30, colors.dark, 0.12],
  ],
  width: Math.max(deviceWidth - 130, 245),
}))`
  elevation: 15;
`;

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

  return (
    <StyledTouchable onPress={handleFocus}>
      <ShadowContainer deviceWidth={deviceWidth} style={style}>
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
