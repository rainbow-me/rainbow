import React, { useCallback } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../../styles';
import { haptics, magicMemo } from '../../utils';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Centered, InnerBorder } from '../layout';

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

const FloatingActionButton = ({
  backgroundColor,
  children,
  disabled,
  onPress,
  onPressIn,
  scaleTo = 0.86,
  shadows = FloatingActionButtonShadow,
  size = FloatingActionButtonSize,
  ...props
}) => {
  const handlePress = useCallback(
    event => {
      haptics.impactLight();
      if (onPress) onPress(event);
    },
    [onPress]
  );

  const handlePressIn = useCallback(
    event => {
      haptics.impactLight();
      if (onPressIn) onPressIn(event);
    },
    [onPressIn]
  );

  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      scaleTo={scaleTo}
      useLateHaptic={false}
      {...props}
    >
      <ShadowStack
        {...borders.buildCircleAsObject(size)}
        hideShadow={disabled}
        shadows={shadows}
      >
        <Content backgroundColor={disabled ? colors.grey : backgroundColor}>
          {typeof children === 'function' ? children({ size }) : children}
          {!disabled && <InnerBorder opacity={0.06} radius={size / 2} />}
        </Content>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

export default magicMemo(FloatingActionButton, [
  'disabled',
  'scaleTo',
  'onPress',
]);
