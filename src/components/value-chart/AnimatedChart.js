import { Group, Shape, Surface } from '@react-native-community/art';
import { interpolatePath } from 'd3-interpolate-path';
import * as shape from 'd3-shape';
// import * as interpolatePath from 'd3-interpolate-path';
import { maxBy, minBy } from 'lodash';
import React, { Component } from 'react';
import { Animated, View } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import { deviceUtils } from '../../utils';
import { Text } from '../text';

const startPath = `M45,50a5,5 0 1,0 10,0a5,5 0 1,0 -10,0`;
const endPath = `M20,50a30,30 0 1,0 60,0a30,30 0 1,0 -60,0`;

const pickImportantPoints = (array, indexInterval) => {
  const result = [];
  let xs = [];
  let ys = [];
  array.forEach(point => {
    if (point.isImportant) {
      xs.push(point.x);
      ys.push(point.y);
    }
  });

  if (xs.length <= 2) {
    result.push(array[0]);
    let thresholdIndex = indexInterval;
    for (let i = 1; i < array.length; i++) {
      if (i === array.length - 1) {
        result.push(array[i]);
      } else if (array[i].y === 0 || array[i].y === 200) {
        result.push(array[i]);
        thresholdIndex = i + indexInterval;
      } else if (i === thresholdIndex) {
        result.push(array[i]);
        thresholdIndex += indexInterval;
      }
    }

    xs = [];
    ys = [];
    result.forEach(point => {
      xs.push(point.x);
      ys.push(point.y);
    });
  }

  return { xs, ys };
};

const horizontalMarginSize = 40;
const width = deviceUtils.dimensions.width - 20;
const height = deviceUtils.dimensions.height;

export default class animations extends Component {
  state = {
    animation: new Animated.Value(0),
  };

  componentWillReceiveProps = (nextProps) => {
    if (this.props.currentData !== nextProps.currentData) {
      let data = nextProps.currentData.points;

      const newArr = data.filter(function (value, index) {
        return index % 3 === 0;
      });

      newArr[0] = nextProps.currentData.points[0];
      newArr.push(
        nextProps.currentData.points[nextProps.currentData.points.length - 1]
      );

      const maxValue = maxBy(data, 'y');
      const minValue = minBy(data, 'y');

      const minX = nextProps.currentData.points[0].x;
      const maxX =
        nextProps.currentData.points[nextProps.currentData.points.length - 1].x;

      const lineShape = shape
        .line()
        .curve(shape.curveCatmullRom.alpha(0.5))
        .x(d => (d.x - minX) / ((maxX - minX) / width))
        .y(d => (d.y - minValue.y) / ((maxValue.y - minValue.y) / 170));

      const a = lineShape(data);
      const b = lineShape(newArr);


      const pathInterpolate = interpolatePath(a, b);

      const listenerId = this.state.animation.addListener(({ value }) => {
        const path = pathInterpolate(value);
        this._path.setNativeProps({
          d: path,
          strokeWidth: value * 1.5 + 1.5,
        });
      });

      this.setState({ currentChart: a, listenerId });

      this.handlePress();
    } else {
      // let data = nextProps.currentData.points;

      // const newArr = data.filter(function (value, index) {
      //   return index % 3 === 0;
      // });

      // newArr[0] = nextProps.currentData.points[0];
      // newArr.push(
      //   nextProps.currentData.points[nextProps.currentData.points.length - 1]
      // );

      // const maxValue = maxBy(data, 'y');
      // const minValue = minBy(data, 'y');

      // const minX = nextProps.currentData.points[0].x;
      // const maxX =
      //   nextProps.currentData.points[nextProps.currentData.points.length - 1].x;

      // const lineShape = shape
      //   .line()
      //   .curve(shape.curveCatmullRom.alpha(0.5))
      //   .x(d => (d.x - minX) / ((maxX - minX) / width))
      //   .y(d => (d.y - minValue.y) / ((maxValue.y - minValue.y) / 170));

      // const a = lineShape(data);
      // const b = lineShape(newArr);


      // const pathInterpolate = interpolatePath(a, b);

      // const listenerId = this.state.animation.addListener(({ value }) => {
      //   const path = pathInterpolate(value);
      //   this._path.setNativeProps({
      //     d: path,
      //     strokeWidth: value * 1.5 + 1.5,
      //   });
      // });

      // this.setState({ currentChart: a, listenerId });
    }
  };

  componentWillUnmount = () => {
    this.state.animation.removeListener(this.state.listenerId);
  };

  handlePress = () => {
    console.log(this.state.animation);
      Animated.sequence([
        Animated.timing(this.state.animation, {
          duration: 200,
          toValue: 1,
        })
      ]).start();
      // Animated.sequence([
      //   Animated.timing(this.state.animation, {
      //     duration: 200,
      //     toValue: 0,
      //   })
      // ]).start();
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
