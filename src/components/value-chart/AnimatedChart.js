import { interpolatePath } from 'd3-interpolate-path';
import * as shape from 'd3-shape';
// import * as interpolatePath from 'd3-interpolate-path';
import { maxBy, minBy } from 'lodash';
import React, { Component } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { deviceUtils } from '../../utils';

const width = deviceUtils.dimensions.width - 20;

export default class animations extends Component {
  state = {
    animation: new Animated.Value(0),
  };

  componentWillReceiveProps = nextProps => {
    if (this.props.currentData !== nextProps.currentData) {
      let data = nextProps.currentData.points;
      let prevData = this.props.currentData.points;

      const maxValue = maxBy(data, 'y');
      const minValue = minBy(data, 'y');
      const oldMaxValue = maxBy(prevData, 'y');
      const oldMinValue = minBy(prevData, 'y');

      const minX = nextProps.currentData.points[0].x;
      const maxX =
        nextProps.currentData.points[nextProps.currentData.points.length - 1].x;

      const oldMinX = this.props.currentData.points[0].x;
      const oldMaxX = this.props.currentData.points[
        this.props.currentData.points.length - 1
      ].x;

      const lineShape = shape
        .line()
        .curve(shape.curveCatmullRom.alpha(0.5))
        .x(d => (d.x - minX) / ((maxX - minX) / width))
        .y(d => (d.y - minValue.y) / ((maxValue.y - minValue.y) / 170));

      const oldLineShape = shape
        .line()
        .curve(shape.curveCatmullRom.alpha(0.5))
        .x(d => (d.x - oldMinX) / ((oldMaxX - oldMinX) / width))
        .y(
          d => (d.y - oldMinValue.y) / ((oldMaxValue.y - oldMinValue.y) / 170)
        );

      let a = oldLineShape(prevData);
      let b = lineShape(data);

      if (this.animatedIsDone) {
        a = lineShape(data);
        b = oldLineShape(prevData);
      }

      const pathInterpolate = interpolatePath(a, b);

      const listenerId = this.state.animation.addListener(({ value }) => {
        const path = pathInterpolate(value);
        this._path.setNativeProps({
          d: path,
        });
      });

      this.listenerId = listenerId;
      setTimeout(() => {
        this.handlePress();
      }, 500);
    }
  };

  componentWillUnmount = () => {
    this.state.animation.removeListener(this.listenerId);
  };

  handlePress = () => {
    if (!this.animatedIsDone) {
      Animated.timing(this.state.animation, {
        duration: 200,
        toValue: 1,
      }).start();
      this.animatedIsDone = true;
    } else {
      Animated.timing(this.state.animation, {
        duration: 200,
        toValue: 0,
      }).start();
      this.animatedIsDone = false;
    }
  };

  render() {
    return (
      <View
        style={{
          position: 'absolute',
          transform: [{ rotateX: '180deg' }],
        }}
      >
        <Svg width={width} height={200} viewBox={`-25 -10 ${width + 25} 200`}>
          <Path
            d={this.state.currentChart}
            stroke="red"
            strokeWidth={1.5}
            ref={path => (this._path = path)}
          />
        </Svg>
      </View>
    );
  }
}
