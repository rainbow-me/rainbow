import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { spring } from 'react-native-redash';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import ValueTime from './ValueTime';
import { colors } from '../../styles';

const springConfig = {
  damping: 38,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 600,
};

const interval = {
  DAY: 0,
  MONTH: 2,
  WEEK: 1,
  YEAR: 3,
};

const { Clock, cond, neq, set, Value } = Animated;

const bottomSpaceWidth = deviceUtils.dimensions.width / (4 * 2);

class TimespanSelector extends React.Component {
  propTypes = {
    direction: PropTypes.bool,
    reloadChart: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.clock = new Clock();
    this.positionX = new Value(-bottomSpaceWidth * 3);
    this.translateX = new Value(-bottomSpaceWidth * 3);

    this.state = {
      currentInterval: 0,
    };
  }

  reloadChartToDay = () => {
    this.positionX.setValue(-bottomSpaceWidth * 3);
    this.setState({ currentInterval: interval.DAY });
    this.props.reloadChart(interval.DAY);
  };

  reloadChartToWeek = () => {
    this.positionX.setValue(-bottomSpaceWidth);
    this.setState({ currentInterval: interval.WEEK });
    this.props.reloadChart(interval.WEEK);
  };

  reloadChartToMonth = () => {
    this.positionX.setValue(bottomSpaceWidth);
    this.setState({ currentInterval: interval.MONTH });
    this.props.reloadChart(interval.MONTH);
  };

  reloadChartToYear = () => {
    this.positionX.setValue(bottomSpaceWidth * 3);
    this.setState({ currentInterval: interval.YEAR });
    this.props.reloadChart(interval.YEAR);
  };

  render() {
    return (
      <>
        <Animated.View
          style={[
            {
              backgroundColor: this.props.direction
                ? colors.chartGreen
                : colors.red,
              borderRadius: 15,
              height: 30,
              marginBottom: -30,
              width: 30,
              zIndex: 10,
            },
            {
              transform: [{ translateX: this.translateX }],
            },
          ]}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: deviceUtils.dimensions.width,
            zIndex: 11,
          }}
        >
          <ButtonPressAnimation onPress={this.reloadChartToDay}>
            <ValueTime selected={this.state.currentInterval === interval.DAY}>
              1D
            </ValueTime>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={this.reloadChartToWeek}>
            <ValueTime selected={this.state.currentInterval === interval.WEEK}>
              1W
            </ValueTime>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={this.reloadChartToMonth}>
            <ValueTime selected={this.state.currentInterval === interval.MONTH}>
              1M
            </ValueTime>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={this.reloadChartToYear}>
            <ValueTime selected={this.state.currentInterval === interval.YEAR}>
              1Y
            </ValueTime>
          </ButtonPressAnimation>
        </View>
        <Animated.Code
          exec={cond(
            neq(this.positionX, this.translateX),
            set(
              this.translateX,
              spring({
                clock: this.clock,
                config: springConfig,
                duration: 120,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                from: this.translateX,
                to: this.positionX,
              })
            )
          )}
        />
      </>
    );
  }
}

export default TimespanSelector;
