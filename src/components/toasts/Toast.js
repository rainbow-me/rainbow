import React, { Fragment } from 'react';
import Animated from 'react-native-reanimated';
import { useSpringTransition } from 'react-native-redash/src/v1';
import { useSafeArea } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { interpolate } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import { useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding, position, shadow } from '@rainbow-me/styles';

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
})(({ color, insets, deviceWidth, theme: { colors } }) => ({
  ...shadow.buildAsObject(0, 6, 10, colors.shadow, 0.14),

  ...padding.object(9, 10, 11, 10),
  ...position.centeredAsObject,
  backgroundColor: color,
  borderRadius: 20,
  bottom: (insets.bottom || 40) + 3,
  maxWidth: deviceWidth - 38,
  position: 'absolute',
  zIndex: 100,
}));

const ToastsWrapper = styled.View({
  bottom: ({ insets }) => (insets.bottom || 40) + 3,
  position: 'absolute',
});

export function ToastsContainer({ children }) {
  return <ToastsWrapper>{children}</ToastsWrapper>;
}

export default function Toast({
  children,
  color,
  distance = 60,
  targetTranslate = 0,
  icon,
  isVisible,
  testID,
  text,
  textColor,
  ...props
}) {
  const { colors, isDarkMode } = useTheme();
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

  const currentColor = color || isDarkMode ? colors.darkModeDark : colors.dark;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Container
        color={currentColor}
        deviceWidth={deviceWidth}
        insets={insets}
        testID={testID}
        {...props}
      >
        {children || (
          <Fragment>
            {icon && (
              <Icon
                color={textColor || colors.whiteLabel}
                marginTop={3}
                name={icon}
              />
            )}
            <TruncatedText
              color={textColor || colors.whiteLabel}
              size="smedium"
              weight="bold"
            >
              {text}
            </TruncatedText>
          </Fragment>
        )}
      </Container>
    </Animated.View>
  );
}
