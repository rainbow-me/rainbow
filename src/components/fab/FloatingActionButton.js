import React, { useCallback, useMemo } from 'react';
import { darkModeThemeColors } from '../../styles/colors';
import { useTheme } from '../../theme/ThemeContext';
import { magicMemo } from '../../utils';
import ButtonPressAnimation, { ScaleButtonZoomableAndroid } from '../animations/ButtonPressAnimation';
import { Centered, InnerBorder } from '../layout';
import styled from '@/styled-thing';
import { borders, position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';

export const FloatingActionButtonSize = 56;

export const FloatingActionButtonShadow = colors => [
  [0, 2, 5, colors.shadow, 0.2],
  [0, 6, 10, colors.shadow, 0.14],
  [0, 1, 18, colors.shadow, 0.12],
];

const DarkModeShadow = [[0, 10, 30, darkModeThemeColors.shadow, 1]];

const Content = styled(Centered)({
  ...position.coverAsObject,
  backgroundColor: ({ backgroundColor }) => backgroundColor,
});

const Wrapper = android ? ScaleButtonZoomableAndroid : ButtonPressAnimation;

const FloatingActionButton = ({
  backgroundColor,
  children,
  disabled,
  onPress,
  onPressIn,
  scaleTo = 0.8,
  shadows: givenShadows,
  size = FloatingActionButtonSize,
  testID,
  ...props
}) => {
  const { isDarkMode, colors } = useTheme();
  const shadows = useMemo(() => givenShadows || FloatingActionButtonShadow(colors), [givenShadows, colors]);

  const handlePress = useCallback(
    event => {
      if (onPress) onPress(event);
    },
    [onPress]
  );

  const handlePressIn = useCallback(
    event => {
      if (onPressIn) onPressIn(event);
    },
    [onPressIn]
  );

  return (
    <Wrapper
      disabled={disabled || android}
      hapticType="impactLight"
      onPress={handlePress}
      onPressIn={handlePressIn}
      overflowMargin={25}
      scaleTo={scaleTo}
      useLateHaptic={false}
      {...props}
    >
      <ShadowStack
        {...borders.buildCircleAsObject(size)}
        backgroundColor={colors.alpha(backgroundColor, isDarkMode ? 0.8 : 0.5)}
        hideShadow={disabled}
        shadows={isDarkMode ? DarkModeShadow : shadows}
      >
        <ButtonPressAnimation
          disabled={disabled || ios}
          onPress={handlePress}
          reanimatedButton
          style={{
            height: size,
          }}
          testID={testID}
        >
          <Content backgroundColor={disabled ? colors.grey : backgroundColor}>
            {typeof children === 'function' ? children({ size }) : children}
            {!disabled && <InnerBorder opacity={0.06} radius={size / 2} />}
          </Content>
        </ButtonPressAnimation>
      </ShadowStack>
    </Wrapper>
  );
};

export default magicMemo(FloatingActionButton, ['disabled', 'onPress', 'scaleTo', 'shadows', 'backgroundColor']);
