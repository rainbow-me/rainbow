import MaskedView from '@react-native-community/masked-view';
import React, { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { withThemeContext } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { CoinRowHeight } from '../coin-row';
import { Row } from '../layout';
import { position } from '@rainbow-me/styles';

export const AssetListItemSkeletonHeight = CoinRowHeight;

export const FakeAvatar = styled(View)`
  ${position.size(40)};
  background-color: ${({ theme: { colors } }) => colors.skeleton};
  border-radius: 20;
`;

export const FakeRow = styled(Row).attrs({
  align: 'flex-end',
  flex: 0,
  height: 10,
  justify: 'space-between',
  paddingBottom: 5,
  paddingTop: 5,
})(Row);

export const FakeText = styled(View)`
  background-color: ${({ theme: { colors } }) => colors.skeleton};
  border-radius: 5;
  height: ${({ height = 10 }: { height: number }) => height};
`;

const Gradient = styled(LinearGradient).attrs({
  end: { x: 1, y: 0.5 },
  start: { x: 0, y: 0.5 },
})`
  ${position.size('100%')};
`;

const Wrapper = styled(View)`
  ${position.size('100%')};
`;

function Skeleton({
  animated = true,
  children,
  style,
  colors,
}: {
  animated?: boolean;
  children: React.ReactElement;
  style: ViewProps['style'];
  colors: any;
}) {
  const gradientColors = [
    colors.skeleton,
    colors.shimmer,
    colors.skeleton,
    colors.skeleton,
  ];

  const gradientSteps = [0, 0.2, 0.4, 1];

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      return;
    }
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1250,
        easing: Easing.linear,
      }),
      -1
    );
  }, [animated, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [
        deviceUtils.dimensions.width * -1.17,
        deviceUtils.dimensions.width * 1.17,
      ]
    );
    return {
      backgroundColor: 'red',
      transform: [
        {
          translateX,
        },
      ],
    };
  }, []);

  if (animated) {
    return (
      <MaskedView
        maskElement={<Wrapper style={style}>{children}</Wrapper>}
        style={{ flex: 1 }}
      >
        <View style={{ backgroundColor: gradientColors[0] }}>
          <Animated.View style={animatedStyle}>
            <Gradient colors={gradientColors} locations={gradientSteps} />
          </Animated.View>
        </View>
      </MaskedView>
    );
  }
  return (
    <View
      style={[
        {
          flex: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default withThemeContext(Skeleton);
