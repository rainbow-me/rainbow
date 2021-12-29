import MaskedView from '@react-native-community/masked-view';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import styled from 'rainbowed-components';
import { withThemeContext } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { CoinRowHeight } from '../coin-row';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { padding, position } from '@rainbow-me/styles';

export const AssetListItemSkeletonHeight = CoinRowHeight;

const Container = styled.View({
  height: AssetListItemSkeletonHeight,
  opacity: ({ descendingOpacity, index }) =>
    1 - 0.2 * (descendingOpacity ? index : 0),
  width: '100%',
});

const FakeAvatar = styled.View({
  ...position.sizeAsObject(40),
  backgroundColor: ({ theme: { colors } }) => colors.skeleton,
  borderRadius: 20,
});

const FakeRow = styled(Row).attrs({
  align: 'flex-end',
  flex: 0,
  height: 10,
  justify: 'space-between',
  paddingBottom: 5,
  paddingTop: 5,
})({});

const FakeText = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.skeleton,
  borderRadius: 5,
  height: 10,
});

const Wrapper = styled(RowWithMargins).attrs({
  align: 'flex-end',
  justify: 'space-between',
  margin: 10,
})(({ ignorePaddingHorizontal, theme: { colors } }) => ({
  ...padding.object(
    9,
    ignorePaddingHorizontal ? 0 : 19,
    10,
    ignorePaddingHorizontal ? 0 : 19
  ),
  ...position.sizeAsObject('100%'),
  backgroundColor: colors.transparent,
}));

const Gradient = styled(LinearGradient).attrs({
  end: { x: 1, y: 0.5 },
  start: { x: 0, y: 0.5 },
})(position.sizeAsObject('100%'));

function AssetListItemSkeleton({
  animated = true,
  index = 0,
  descendingOpacity,
  ignorePaddingHorizontal,
  colors,
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

  const style = useAnimatedStyle(() => {
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

  const skeletonElement = (
    <Wrapper ignorePaddingHorizontal={ignorePaddingHorizontal} index={index}>
      <FakeAvatar />
      <ColumnWithMargins
        backgroundColor={colors.transparent}
        flex={1}
        margin={10}
      >
        <FakeRow>
          <FakeText width={100} />
          <FakeText width={80} />
        </FakeRow>
        <FakeRow>
          <FakeText width={60} />
          <FakeText width={50} />
        </FakeRow>
      </ColumnWithMargins>
    </Wrapper>
  );

  return (
    <Container descendingOpacity={descendingOpacity} index={index}>
      {animated ? (
        <MaskedView maskElement={skeletonElement}>
          <View backgroundColor={gradientColors[0]}>
            <Animated.View style={style}>
              <Gradient colors={gradientColors} locations={gradientSteps} />
            </Animated.View>
          </View>
        </MaskedView>
      ) : (
        skeletonElement
      )}
    </Container>
  );
}

export default withThemeContext(AssetListItemSkeleton);
