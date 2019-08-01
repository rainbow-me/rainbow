import MaskedView from '@react-native-community/masked-view';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing } from 'react-native-reanimated';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { deviceUtils } from '../../utils';
import { CoinRow } from '../coin-row';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';

const {
  block,
  Clock,
  cond,
  interpolate,
  set,
  startClock,
  stopClock,
  timing,
  Value,
} = Animated;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Container = styled.View`
  height: ${CoinRow.height};
  opacity: ${({ descendingOpacity, index }) => (1 - (0.2 * (descendingOpacity ? index : 0)))};
  width: 100%;
`;

const FakeAvatar = styled.View`
  ${position.size(40)};
  background-color: ${colors.skeleton};
  border-radius: 20;
`;

const FakeRow = withProps({
  align: 'center',
  flex: 0,
  justify: 'space-between',
})(Row);

const FakeText = styled.View`
  background-color: ${colors.skeleton};
  border-radius: 5;
  height: 10;
`;

const Wrapper = styled(RowWithMargins).attrs({
  align: 'center',
  justify: 'space-between',
  margin: 11,
})`
  ${({ index }) => padding((index === 0 ? 15 : 12.5), 19, 12.5, 15)};
  ${position.size('100%')};
  background-color: ${colors.transparent};
`;

export default class AssetListItemSkeleton extends PureComponent {
  static propTypes = {
    animated: PropTypes.bool,
    descendingOpacity: PropTypes.bool,
    index: PropTypes.number,
  }

  static defaultProps = {
    animated: true,
    index: 0,
  }

  startShimmerLoop = () => {
    const clock = new Clock();

    const state = {
      finished: new Value(0),
      frameTime: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    const config = {
      duration: new Value(1250),
      easing: Easing.linear,
      toValue: new Value(1),
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
        startClock(clock),
      ]),
      state.position,
    ]);
  }

  animation = this.startShimmerLoop()

  renderShimmer = () => {
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

  render = () => {
    const { animated, descendingOpacity, index } = this.props;

    const skeletonElement = (
      <Wrapper index={index}>
        <FakeAvatar />
        <ColumnWithMargins
          backgroundColor={colors.transparent}
          flex={1}
          margin={11}
        >
          <FakeRow marginTop={1}>
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
        {animated
          ? <MaskedView maskElement={skeletonElement}>{this.renderShimmer()}</MaskedView>
          : skeletonElement
        }
      </Container>
    );
  }
}
