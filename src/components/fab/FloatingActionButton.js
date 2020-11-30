import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import { magicMemo } from '../../utils';
import ButtonPressAnimation, {
  ScaleButtonZoomableAndroid,
} from '../animations/ButtonPressAnimation';
import { Centered, InnerBorder } from '../layout';
import { borders, colors, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

export const FloatingActionButtonSize = 56;

export const FloatingActionButtonShadow = [
  [0, 2, 5, colors.dark, 0.2],
  [0, 6, 10, colors.dark, 0.14],
  [0, 1, 18, colors.dark, 0.12],
];

const Content = styled(Centered)`
  ${position.cover};
  background-color: ${({ backgroundColor }) => backgroundColor};
`;

const Wrapper = android ? ScaleButtonZoomableAndroid : ButtonPressAnimation;

const FloatingActionButton = ({
  backgroundColor,
  children,
  disabled,
  onPress,
  onPressIn,
  scaleTo = 0.86,
  shadows = FloatingActionButtonShadow,
  size = FloatingActionButtonSize,
  testID,
  ...props
}) => {
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
        hideShadow={disabled}
        shadows={shadows}
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

export default magicMemo(FloatingActionButton, [
  'disabled',
  'onPress',
  'scaleTo',
]);
