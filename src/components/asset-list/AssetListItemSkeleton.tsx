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
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { withThemeContext } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { interpolate } from '../animations';
import { CoinRowHeight } from '../coin-row';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

const { block, cond, set, startClock, stopClock } = Animated;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  height: ${CoinRowHeight};
  opacity: ${({ descendingOpacity, index }: any) =>
    1 - 0.2 * (descendingOpacity ? index : 0)};
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const FakeAvatar = styled.View`
  ${position.size(40)};
  background-color: ${({ theme: { colors } }: any) => colors.skeleton};
  border-radius: 20;
`;

const FakeRow = styled(Row).attrs({
  align: 'flex-end',
  flex: 0,
  height: 10,
  justify: 'space-between',
  paddingBottom: 5,
  paddingTop: 5,
})(Row);

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const FakeText = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.skeleton};
  border-radius: 5;
  height: 10;
`;

const Wrapper = styled(RowWithMargins).attrs({
  align: 'flex-end',
  justify: 'space-between',
  margin: 10,
})`
  ${({ ignorePaddingHorizontal }) =>
    padding(
      9,
      ignorePaddingHorizontal ? 0 : 19,
      10,
      ignorePaddingHorizontal ? 0 : 19
    )};
  ${position.size('100%')};
  background-color: ${({ theme: { colors } }) => colors.transparent};
`;

class AssetListItemSkeleton extends PureComponent {
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
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ duration: Value<1250>; easing:... Remove this comment to see the full error message
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

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'animated' does not exist on type 'Readon... Remove this comment to see the full error message
  animation = this.props.animated && ios ? this.startShimmerLoop() : () => null;

  renderShimmer() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
    const { colors } = this.props;
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
        deviceUtils.dimensions.width * -1.17,
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
        deviceUtils.dimensions.width * 1.17,
      ],
    });

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View backgroundColor={gradientColors[0]} css={position.size('100%')}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
    const {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'animated' does not exist on type 'Readon... Remove this comment to see the full error message
      animated,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'descendingOpacity' does not exist on typ... Remove this comment to see the full error message
      descendingOpacity,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'ignorePaddingHorizontal' does not exist ... Remove this comment to see the full error message
      ignorePaddingHorizontal,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'index' does not exist on type 'Readonly<... Remove this comment to see the full error message
      index,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
      colors,
    } = this.props;

    const skeletonElement = (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Wrapper ignorePaddingHorizontal={ignorePaddingHorizontal} index={index}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <FakeAvatar />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ColumnWithMargins
          backgroundColor={colors.transparent}
          flex={1}
          margin={10}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <FakeRow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <FakeText width={100} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <FakeText width={80} />
          </FakeRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <FakeRow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <FakeText width={60} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <FakeText width={50} />
          </FakeRow>
        </ColumnWithMargins>
      </Wrapper>
    );

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Container descendingOpacity={descendingOpacity} index={index}>
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        {animated && ios ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

export default withThemeContext(AssetListItemSkeleton);
