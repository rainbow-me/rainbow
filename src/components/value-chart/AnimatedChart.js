import { interpolatePath } from 'd3-interpolate-path';
import * as shape from 'd3-shape';
// import * as interpolatePath from 'd3-interpolate-path';
import { maxBy, minBy } from 'lodash';
import React, { Component } from 'react';
import { Animated, View } from 'react-native';
import { parsePath } from 'react-native-redash';
import Svg, { Path } from 'react-native-svg';
import { deviceUtils } from '../../utils';

const padding = 20;
const additionalChartPadding = 999999;
const width = deviceUtils.dimensions.width;
const chartAnimationDuration = 200;

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
        .curve(shape.curveCatmullRom.alpha(0.5))
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

      const path = parsePath(newLineShape);

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

        setTimeout(() => {
          nextProps.setCurrentPath(path);
          this.handleAnimation();
          setTimeout(() => {
            const path = pathInterpolate(this.animatedIsDone ? 1 : 0);
            this._path.setNativeProps({
              d: path,
            });
          }, chartAnimationDuration + 30);
        }, 100);
      }
    }
  };

  componentWillUnmount = () => {
    this.state.animation.removeListener(this.listenerId);
  };

  handleAnimation = () => {
    if (!this.animatedIsDone) {
      Animated.timing(this.state.animation, {
        duration: chartAnimationDuration,
        toValue: 1,
      }).start();
      this.animatedIsDone = true;
    } else {
      Animated.timing(this.state.animation, {
        duration: chartAnimationDuration,
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
          top: -10,
          transform: [{ rotateX: '180deg' }],
        }}
      >
        <Svg width={width} height={200} viewBox={`0 -20 ${width} 200`}>
          <Path
            d={this.state.currentChart}
            stroke={this.props.color}
            strokeWidth={1.5}
            ref={path => (this._path = path)}
          />
        </Svg>
      </View>
    );
  }
}
