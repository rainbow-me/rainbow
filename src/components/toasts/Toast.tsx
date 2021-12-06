import React, { Fragment } from 'react';
import Animated from 'react-native-reanimated';
import { useSpringTransition } from 'react-native-redash/src/v1';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { interpolate } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
})`
  ${padding(9, 10, 11, 10)};
  ${position.centered};
  ${({ theme: { colors } }) => shadow.build(0, 6, 10, colors.shadow, 0.14)};
  background-color: ${({ color }) => color};
  border-radius: 20;
  bottom: ${({ insets }) => (insets.bottom || 40) + 3};
  max-width: ${({ deviceWidth }) => deviceWidth - 38};
  position: absolute;
  z-index: 100;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const ToastsWrapper = styled.View`
  position: absolute;
  bottom: ${({ insets }: any) => (insets.bottom || 40) + 3};
`;

export function ToastsContainer({ children }: any) {
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
}: any) {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Container
        color={currentColor}
        deviceWidth={deviceWidth}
        insets={insets}
        testID={testID}
        {...props}
      >
        {children || (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Fragment>
            {icon && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Icon
                color={textColor || colors.whiteLabel}
                marginTop={3}
                name={icon}
              />
            )}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
