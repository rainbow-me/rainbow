import { interpolatePath } from 'd3-interpolate-path';
import * as shape from 'd3-shape';
import { maxBy, minBy } from 'lodash';
import React, { Component } from 'react';
import { Animated, Easing, View } from 'react-native';
import { parsePath } from 'react-native-redash';
import Svg, { Path } from 'react-native-svg';
import { deviceUtils } from '../../utils';

const padding = 0;
const additionalChartPadding = 999999;
const width = deviceUtils.dimensions.width;
const chartAnimationDuration = 300;

export default class AnimatedChart extends Component {
  state = {
    animation: new Animated.Value(0),
  };

  componentWillReceiveProps = nextProps => {
    if (nextProps.currentData?.points) {
      let data = nextProps.currentData.points;
      data[data.length - 1].y = nextProps.currentValue;

      const maxValue = maxBy(data, 'y');
      const minValue = minBy(data, 'y');

      const minX = nextProps.currentData.points[0].x;
      const maxX =
        nextProps.currentData.points[nextProps.currentData.points.length - 1].x;

      const lineShape = shape
        .line()
        .curve(shape.curveMonotoneX)
        .x(
          d => (d.x - minX) / ((maxX - minX) / (width - 2 * padding)) + padding
        )
        .y(d => (d.y - minValue.y) / ((maxValue.y - minValue.y) / 160));

      data = [
        {
          x: data[0].x - additionalChartPadding,
          y: data[0].y,
        },
        ...data,
        {
          x: data[data.length - 1].x + additionalChartPadding,
          y: data[data.length - 1].y,
        },
      ];

      const newLineShape = lineShape(data);

      const parsedPath = parsePath(newLineShape);

      if (this.oldLineShape !== newLineShape) {
        let a, b;
        if (this.oldLineShape) {
          if (this.animatedIsDone) {
            a = newLineShape;
            b = this.oldLineShape;
          } else {
            a = this.oldLineShape;
            b = newLineShape;
          }
        } else {
          a = newLineShape;
          b = newLineShape;
        }

        this.oldLineShape = newLineShape;

        const pathInterpolate = interpolatePath(a, b);

        if (this.listenerId) {
          this.state.animation.removeListener(this.listenerId);
        }

        const listenerId = this.state.animation.addListener(({ value }) => {
          const path = pathInterpolate(value);
          this._path.setNativeProps({
            d: path,
          });
        });
        this.listenerId = listenerId;

        this.animatePathTimeout = setTimeout(() => {
          nextProps.setCurrentPath(parsedPath);
          this.handleAnimation();
          this.setPathTimeout = setTimeout(() => {
            const path = pathInterpolate(this.animatedIsDone ? 1 : 0);
            this._path.setNativeProps({
              d: path,
            });
          }, chartAnimationDuration + 100);
        }, 200);
      }
    }
  };

  componentWillUnmount = () => {
    this.state.animation.removeListener(this.listenerId);
    if (this.animatePathTimeout) {
      clearTimeout(this.animatePathTimeout);
    }
    if (this.setPathTimeout) {
      clearTimeout(this.setPathTimeout);
    }
  };

  handleAnimation = () => {
    Animated.timing(this.state.animation, {
      duration: chartAnimationDuration,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      toValue: this.animatedIsDone ? 0 : 1,
    }).start();
    this.animatedIsDone = !this.animatedIsDone;
  };

  render() {
    return (
      <View
        style={{
          position: 'absolute',
          top: -10,
          transform: [{ rotateX: '180deg' }],
        }}
      >
        <Svg height={200} viewBox={`0 -20 ${width} 200`} width={width}>
          <Path
            d={this.state.currentChart}
            ref={path => (this._path = path)}
            stroke={this.props.color}
            strokeWidth={3.25}
          />
        </Svg>
      </View>
    );
  }
}
