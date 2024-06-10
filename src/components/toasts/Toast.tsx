import React, { Fragment, PropsWithChildren, memo, useLayoutEffect } from 'react';
import { Insets, ViewProps } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, WithSpringConfig } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContextProps, useTheme } from '../../theme/ThemeContext';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { padding, position, shadow } from '@/styles';

const springConfig: WithSpringConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.6,
};

interface ContainerParams {
  color: string;
  insets: Insets;
  deviceWidth: number;
  theme: ThemeContextProps;
}

const Container = styled(RowWithMargins).attrs({
  margin: 5,
  self: 'center',
})(({ color, insets, deviceWidth, theme: { colors } }: ContainerParams) => ({
  ...shadow.buildAsObject(0, 6, 10, colors.shadow, 0.14),

  ...padding.object(9, 10, 11, 10),
  ...position.centeredAsObject,
  backgroundColor: color,
  borderRadius: 20,
  bottom: (insets.bottom || 40) + 60,
  maxWidth: deviceWidth - 38,
  position: 'absolute',
  zIndex: 100,
}));

type Props = PropsWithChildren<{
  color?: string;
  distance?: number;
  targetTranslate?: number;
  icon?: any;
  isVisible?: boolean;
  text: string;
  textColor?: string;
}> &
  Pick<ViewProps, 'testID'>;

function Toast({ children, color, distance = 90, targetTranslate = 0, icon, isVisible, testID, text, textColor }: Props) {
  const { colors, isDarkMode } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const insets = useSafeAreaInsets();
  const animation = useSharedValue(isVisible ? 1 : 0);

  useLayoutEffect(() => {
    animation.value = withSpring(isVisible ? 1 : 0, springConfig);
  }, [isVisible, animation]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [distance, targetTranslate], 'extend');

    return {
      opacity: animation.value,
      transform: [{ translateY }],
    };
  });

  const currentColor = color ?? isDarkMode ? colors.darkModeDark : colors.dark;

  return (
    <Animated.View pointerEvents="none" style={animatedStyle}>
      <Container color={currentColor} deviceWidth={deviceWidth} insets={insets} testID={testID}>
        {children ?? (
          <Fragment>
            {icon && <Icon color={textColor ?? colors.whiteLabel} marginTop={3} name={icon} />}
            <TruncatedText color={textColor ?? colors.whiteLabel} size="smedium" weight="bold">
              {text}
            </TruncatedText>
          </Fragment>
        )}
      </Container>
    </Animated.View>
  );
}

export default memo(Toast);
