import React, { Fragment } from 'react';
import Animated from 'react-native-reanimated';
import { useSpringTransition } from 'react-native-redash';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { interpolate } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import { useDimensions } from '@rainbow-me/hooks';
import { colors, padding, position, shadow } from '@rainbow-me/styles';

const springConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.6,
};

const Container = styled(RowWithMargins).attrs({
  margin: 5,
  self: 'center',
})`
  ${padding(9, 10, 11, 10)};
  ${position.centered};
  ${shadow.build(0, 6, 10, colors.dark, 0.14)};
  background-color: ${({ color }) => color};
  border-radius: 20;
  bottom: ${({ insets }) => (insets.bottom || 40) + 3};
  max-width: ${({ deviceWidth }) => deviceWidth - 38};
  position: absolute;
  z-index: 100;
`;

const ToastsWrapper = styled.View`
  position: absolute;
  bottom: ${({ insets }) => (insets.bottom || 40) + 3};
`;

export function ToastsContainer({ children }) {
  return <ToastsWrapper>{children}</ToastsWrapper>;
}

export default function Toast({
  children,
  color = colors.dark,
  distance = 60,
  targetTranslate = 0,
  icon,
  isVisible,
  testID,
  text,
  textColor = colors.white,
  ...props
}) {
  const { width: deviceWidth } = useDimensions();
  const insets = useSafeArea();

  const animation = useSpringTransition(isVisible, springConfig);

  const opacity = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [distance, targetTranslate],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Container
        color={color}
        deviceWidth={deviceWidth}
        insets={insets}
        testID={testID}
        {...props}
      >
        {children || (
          <Fragment>
            {icon && <Icon color={textColor} marginTop={3} name={icon} />}
            <TruncatedText color={textColor} size="smedium" weight="semibold">
              {text}
            </TruncatedText>
          </Fragment>
        )}
      </Container>
    </Animated.View>
  );
}
