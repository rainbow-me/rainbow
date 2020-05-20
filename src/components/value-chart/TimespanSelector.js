import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import Animated, { spring, Value } from 'react-native-reanimated';
import ChartTypes from '../../helpers/chartTypes';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import ValueTime from './ValueTime';

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

const bottomSpaceWidth = deviceUtils.dimensions.width / (4 * 2);

class TimespanSelector extends React.Component {
  propTypes = {
    color: PropTypes.string,
    isLoading: PropTypes.bool,
    reloadChart: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.translateX = new Value(Math.round(-bottomSpaceWidth * 3));

    this.state = {
      currentInterval: 0,
    };
  }

  animateTransition = index => {
    spring(this.translateX, {
      toValue: Math.floor(bottomSpaceWidth * (index * 2 - 3)),
      ...springConfig,
    }).start();
  };

  reloadChartToDay = () => {
    this.animateTransition(0);
    setTimeout(() => {
      this.setState({ currentInterval: interval.DAY });
      this.props.reloadChart(ChartTypes.day);
    });
  };

  reloadChartToWeek = () => {
    this.animateTransition(1);
    setTimeout(() => {
      this.setState({ currentInterval: interval.WEEK });
      this.props.reloadChart(ChartTypes.week);
    });
  };

  reloadChartToMonth = () => {
    this.animateTransition(2);
    setTimeout(() => {
      this.setState({ currentInterval: interval.MONTH });
      this.props.reloadChart(ChartTypes.month);
    });
  };

  reloadChartToYear = () => {
    this.animateTransition(3);
    setTimeout(() => {
      this.setState({ currentInterval: interval.YEAR });
      this.props.reloadChart(ChartTypes.year);
    });
  };

  render() {
    let color = 'gray';
    if (!this.props.isLoading) {
      color = this.props.color;
    }
    return (
      <>
        <Animated.View
          style={[
            {
              backgroundColor: color,
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
            <ValueTime
              selected={this.state.currentInterval === interval.MONTH}
              marginRight={1}
            >
              1M
            </ValueTime>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={this.reloadChartToYear}>
            <ValueTime selected={this.state.currentInterval === interval.YEAR}>
              1Y
            </ValueTime>
          </ButtonPressAnimation>
        </View>
      </>
    );
  }
}

export default TimespanSelector;
