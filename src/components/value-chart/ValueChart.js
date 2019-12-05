import React, { Fragment, PureComponent } from 'react';
import { maxBy, minBy } from 'lodash';
import Svg, { Path } from 'react-native-svg';
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';
import Spline from 'cubic-spline';
import { contains, timing } from 'react-native-redash';
import { View } from 'react-native';
import { data1, data2, data3, data4 } from './data';
import ValueText from './ValueText';
import { deviceUtils } from '../../utils';
import { colors } from '../../styles';
import TimestampText from './TimestampText';
import TimespanSelector from './TimespanSelector';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const {
  and,
  or,
  eq,
  add,
  sub,
  onChange,
  Value,
  Clock,
  block,
  event,
  concat,
  cond,
  call,
  set,
  neq,
  multiply,
  greaterOrEq,
  lessThan,
  greaterThan,
  stopClock,
} = Animated;

const { BEGAN, ACTIVE, CANCELLED, END, FAILED, UNDETERMINED } = State;

const FALSE = 1;
const TRUE = 0;

const width = deviceUtils.dimensions.width;
const height = 170;
const chartPadding = 16;

const strokeWidth = 1.5;
const thickStrokeWidthDifference = 1.5;

const flipY = { transform: [{ scaleX: 1 }, { scaleY: -1 }] };

const indexInterval = 10;
const heightInterval = 200;

const pickImportantPoints = array => {
  const result = [];
  result.push(array[0]);
  let thresholdIndex = indexInterval;
  let thresholdHeight = array[0].y;
  for (let i = 1; i < array.length; i++) {
    if (i === array.length - 1) {
      result.push(array[i]);
    } else if (Math.abs(thresholdHeight - array[i].y) > heightInterval) {
      result.push(array[i]);
      thresholdIndex = i + indexInterval;
      thresholdHeight = array[i].y;
    } else if (array[i].y === 0 || array[i].y === 200) {
      result.push(array[i]);
      thresholdIndex = i + indexInterval;
      thresholdHeight = array[i].y;
    } else if (i === thresholdIndex) {
      result.push(array[i]);
      thresholdIndex += indexInterval;
      thresholdHeight = array[i].y;
    }
  }

  const xs = [];
  const ys = [];
  result.forEach(point => {
    xs.push(point.x);
    ys.push(point.y);
  });

  return { xs, ys };
};

export default class ValueChart extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      data: data1,
      hideLoadingBar: false,
      shouldRenderChart: true,
    };

    this.clock = new Clock();
    this.clockReversed = new Clock();
    this.opacityClock = new Clock();
    this.opacityClockReversed = new Clock();
    this.loadingClock = new Clock();
    this.loadingValue = new Value(1);
    this.gestureState = new Value(UNDETERMINED);
    this.handle = undefined;
    this.value = new Value(1);
    this.opacity = new Value(0);
    this.shouldSpring = new Value(0);
    this.isLoading = new Value(FALSE);

    this.onTapGestureEvent = event([
      {
        nativeEvent: {
          state: this.gestureState,
          x: x =>
            cond(
              and(greaterOrEq(x, 0), lessThan(x, width)),
              set(this.touchX, x)
            ),
        },
      },
    ]);

    this.onHandlerStateChange = event([
      {
        nativeEvent: {
          state: state =>
            block([cond(neq(FAILED, state), set(this.gestureState, state))]),
        },
      },
    ]);
  }

  touchX = new Value(150);
  lastTouchX = new Value(150);

  onPanGestureEvent = event(
    [
      {
        nativeEvent: {
          x: x =>
            cond(
              and(
                neq(this.lastTouchX, x),
                greaterOrEq(x, 0),
                lessThan(x, width)
              ),
              [set(this.touchX, x), set(this.lastTouchX, x)]
            ),
        },
      },
    ],
    { useNativeDriver: true }
  );

  reloadChart = currentInterval => {
    const dataset = [data1, data2, data3, data4];

    this.isLoading.setValue(TRUE);
    setTimeout(() => {
      this.setState({ data: dataset[currentInterval] });
    }, 400);
    setTimeout(() => {
      this.isLoading.setValue(FALSE);
    }, 1200);
  };

  createAnimatedPath = () => {
    const maxValue = maxBy(this.state.data, 'value');
    const minValue = minBy(this.state.data, 'value');

    const timestampLength =
      this.state.data[this.state.data.length - 1].timestamp -
      this.state.data[0].timestamp;
    const xMultiply = width / timestampLength;

    const yMultiply = height / (maxValue.value - minValue.value);

    const points = this.state.data.map(({ timestamp, value }) => ({
      x: (timestamp - this.state.data[0].timestamp) * xMultiply,
      y: (value - minValue.value) * yMultiply,
    }));

    const importantPoints = pickImportantPoints(points);
    const spline = new Spline(importantPoints.xs, importantPoints.ys);
    const loadingMultiplayer = height / 2 + chartPadding / 4;
    const splinePoints = points
      .map(({ x, y }) => {
        return { x, y1: y, y2: spline.at(x) };
      })
      .filter(Boolean);

    const animatedPath = concat(
      'M 2 ',
      add(
        multiply(
          add(
            splinePoints[0].y1,
            multiply(this.value, sub(splinePoints[0].y2, splinePoints[0].y1))
          ),
          this.loadingValue
        ),
        sub(loadingMultiplayer, multiply(loadingMultiplayer, this.loadingValue))
      ),
      ...splinePoints.flatMap(({ x, y1, y2 }) => [
        'L',
        x,
        ' ',
        add(
          multiply(
            add(y1, multiply(this.value, sub(y2, y1))),
            this.loadingValue
          ),
          sub(
            loadingMultiplayer,
            multiply(loadingMultiplayer, this.loadingValue)
          )
        ),
      ])
    );

    return animatedPath;
  };

  checkValueBoundaries = value => {
    if (Math.abs(value) > width / 2 - 25) {
      return value > 0 ? value - 25 : value + 25;
    }
    return value;
  };

  render() {
    const maxValue = maxBy(this.state.data, 'value');
    const minValue = minBy(this.state.data, 'value');
    const change =
      ((this.state.data[this.state.data.length - 1].value -
        this.state.data[0].value) /
        this.state.data[0].value) *
      100;

    const timePeriod =
      this.state.data[this.state.data.length - 1].timestamp -
      this.state.data[0].timestamp;

    const maxValueDistance = this.checkValueBoundaries(
      ((maxValue.timestamp - this.state.data[0].timestamp) / timePeriod) *
        width -
        width / 2
    );
    const minValueDistance = this.checkValueBoundaries(
      ((minValue.timestamp - this.state.data[0].timestamp) / timePeriod) *
        width -
        width / 2
    );

    const animatedPath = this.state.shouldRenderChart
      ? this.createAnimatedPath()
      : null;
    return (
      <Fragment>
        <ValueText
          headerText="PRICE"
          startValue={this.state.data[this.state.data.length - 1].value}
          direction={change > 0}
          change={change.toFixed(2)}
          ref={component => {
            this._text = component;
          }}
        />
        <TapGestureHandler
          onHandlerStateChange={this.onTapGestureEvent}
          maxDeltaY={50}
        >
          <Animated.View>
            <PanGestureHandler
              minDist={1}
              shouldActivateOnStart
              onGestureEvent={this.onPanGestureEvent}
              onHandlerStateChange={this.onHandlerStateChange}
              failOffsetY={4}
            >
              <Animated.View
                style={{
                  justifyContent: 'flex-start',
                }}
              >
                <TimestampText
                  style={{ transform: [{ translateX: maxValueDistance }] }}
                >
                  ${Number(maxValue.value).toFixed(2)}
                </TimestampText>
                <View style={{ flexDirection: 'row' }}>
                  <View
                    style={{
                      height: 200,
                      width,
                    }}
                  >
                    <Svg
                      height={width}
                      width={width}
                      viewBox={`2 ${height +
                        chartPadding -
                        width} ${width} ${width}`}
                      preserveAspectRatio="none"
                      style={flipY}
                    >
                      <AnimatedPath
                        id="main-path"
                        fill="none"
                        stroke={change > 0 ? colors.chartGreen : colors.red}
                        strokeWidth={add(
                          strokeWidth,
                          multiply(this.value, thickStrokeWidthDifference)
                        )}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        d={animatedPath}
                      />
                    </Svg>
                  </View>
                  <Animated.View
                    style={[
                      {
                        backgroundColor:
                          change > 0 ? colors.chartGreen : colors.red,
                        borderRadius: 2,
                        height: 180,
                        position: 'absolute',
                        top: 10,
                        width: 2,
                        zIndex: 10,
                      },
                      {
                        opacity: this.opacity,
                        transform: [
                          {
                            translateX: Animated.add(
                              this.touchX,
                              new Animated.Value(-1.5)
                            ),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
                <TimestampText
                  style={{ transform: [{ translateX: minValueDistance }] }}
                >
                  ${Number(minValue.value).toFixed(2)}
                </TimestampText>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </TapGestureHandler>
        <TimespanSelector
          reloadChart={this.reloadChart}
          direction={change > 0}
        />
        <Animated.Code
          exec={block([
            cond(
              or(eq(this.gestureState, ACTIVE), eq(this.gestureState, BEGAN)),
              set(this.shouldSpring, 1)
            ),
            cond(
              contains([FAILED, CANCELLED, END], this.gestureState),
              block([
                set(this.shouldSpring, 0),
                call([], () => {
                  this._text.updateValue(
                    this.state.data[this.state.data.length - 1].value
                  );
                }),
              ])
            ),
            onChange(
              this.touchX,
              call([this.touchX], ([x]) => {
                this._text.updateValue(
                  this.state.data[
                    Math.floor(x / (width / this.state.data.length))
                  ].value
                );
              })
            ),
            cond(
              and(greaterThan(this.value, 0), eq(this.shouldSpring, 1)),
              block([
                stopClock(this.clockReversed),
                set(
                  this.value,
                  timing({
                    clock: this.clock,
                    duration: 350,
                    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                    from: this.value,
                    to: 0,
                  })
                ),
              ])
            ),
            cond(
              and(lessThan(this.value, 1), eq(this.shouldSpring, 0)),
              block([
                stopClock(this.clock),
                set(
                  this.value,
                  timing({
                    clock: this.clockReversed,
                    duration: 350,
                    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                    from: this.value,
                    to: 1,
                  })
                ),
              ])
            ),
            cond(
              and(lessThan(this.opacity, 1), eq(this.shouldSpring, 1)),
              block([
                set(
                  this.opacity,
                  timing({
                    clock: this.opacityClock,
                    duration: 500,
                    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                    from: this.opacity,
                    to: 1,
                  })
                ),
                stopClock(this.opacityClockReversed),
              ])
            ),
            cond(
              and(greaterThan(this.opacity, 0), eq(this.shouldSpring, 0)),
              block([
                set(
                  this.opacity,
                  timing({
                    clock: this.opacityClockReversed,
                    duration: 500,
                    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                    from: this.opacity,
                    to: 0,
                  })
                ),
                stopClock(this.opacityClock),
              ])
            ),
            cond(
              neq(this.loadingValue, cond(eq(this.isLoading, 1), 1, 0)),
              set(
                this.loadingValue,
                timing({
                  clock: this.clock,
                  duration: 150,
                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                  from: this.loadingValue,
                  to: cond(eq(this.isLoading, 1), 1, 0),
                })
              )
            ),
          ])}
        />
      </Fragment>
    );
  }
}
