import MaskedView from '@react-native-community/masked-view';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Clock,
  Easing,
  timing,
  Value,
} from 'react-native-reanimated';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { deviceUtils } from '../../utils';
import { interpolate } from '../animations';
import { CoinRowHeight } from '../coin-row';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { colors, padding, position } from '@rainbow-me/styles';

const { block, cond, set, startClock, stopClock } = Animated;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Container = styled.View`
  height: ${CoinRowHeight};
  opacity: ${({ descendingOpacity, index }) =>
    1 - 0.2 * (descendingOpacity ? index : 0)};
  width: 100%;
`;

const FakeAvatar = styled.View`
  ${position.size(40)};
  background-color: ${colors.skeleton};
  border-radius: 20;
`;

const FakeRow = withProps({
  align: 'flex-end',
  flex: 0,
  height: 10,
  justify: 'space-between',
  paddingBottom: 5,
  paddingTop: 5,
})(Row);

const FakeText = styled.View`
  background-color: ${colors.skeleton};
  border-radius: 5;
  height: 10;
`;

const Wrapper = styled(RowWithMargins).attrs({
  align: 'flex-end',
  justify: 'space-between',
  margin: 10,
})`
  ${padding(9, 19, 10, 19)};
  ${position.size('100%')};
  background-color: ${colors.transparent};
`;

export default class AssetListItemSkeleton extends PureComponent {
  static propTypes = {
    animated: PropTypes.bool,
    descendingOpacity: PropTypes.bool,
    index: PropTypes.number,
  };

  static defaultProps = {
    animated: true,
    index: 0,
  };

  startShimmerLoop() {
    const clock = new Clock();

    const config = {
      duration: new Value(1250),
      easing: Easing.linear,
      toValue: new Value(1),
    };

    const state = {
      finished: new Value(0),
      frameTime: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    return block([
      startClock(clock),
      timing(clock, state, config),
      cond(state.finished, [
        stopClock(clock),
        set(state.finished, 0),
        set(state.position, 0),
        set(state.time, 0),
        set(state.frameTime, 0),
      ]),
      state.position,
    ]);
  }

  animation = this.props.animated && ios ? this.startShimmerLoop() : () => null;

  renderShimmer() {
    const gradientColors = [
      colors.skeleton,
      colors.shimmer,
      colors.skeleton,
      colors.skeleton,
    ];

    const gradientSteps = [0, 0.2, 0.4, 1];

    const translateX = interpolate(this.animation, {
      inputRange: [0, 1],
      outputRange: [
        deviceUtils.dimensions.width * -1.17,
        deviceUtils.dimensions.width * 1.17,
      ],
    });

    return (
      <View backgroundColor={gradientColors[0]} css={position.size('100%')}>
        <AnimatedLinearGradient
          {...position.sizeAsObject('100%')}
          colors={gradientColors}
          end={{ x: 1, y: 0.5 }}
          locations={gradientSteps}
          start={{ x: 0, y: 0.5 }}
          style={{ transform: [{ translateX }] }}
        />
      </View>
    );
  }

  render() {
    const { animated, descendingOpacity, index } = this.props;

    const skeletonElement = (
      <Wrapper index={index}>
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
        {animated && ios ? (
          <MaskedView maskElement={skeletonElement}>
            {this.renderShimmer()}
          </MaskedView>
        ) : (
          skeletonElement
        )}
      </Container>
    );
  }
}
