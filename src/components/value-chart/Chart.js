import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { maxBy, minBy } from 'lodash';
import Svg, { Path } from 'react-native-svg';
import { State } from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';
import Spline from 'cubic-spline';
import { contains, timing, delay } from 'react-native-redash';
import { View } from 'react-native';
import { deviceUtils } from '../../utils';
import { colors } from '../../styles';
import TimestampText from './TimestampText';
import ActivityIndicator from '../ActivityIndicator';
import GestureWrapper from './GestureWrapper';

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

const simplifyChartData = (data, destinatedNumberOfPoints) => {
  if (data.length > destinatedNumberOfPoints) {
    let destMul = data.length / destinatedNumberOfPoints;
    const maxValue = maxBy(data, 'value');
    const minValue = minBy(data, 'value');

    const timestampMul = Math.floor(
      (data[data.length - 1].timestamp - data[0].timestamp) / data.length
    );
    let newData = [];
    newData.push({
      timestamp: data[0].timestamp - timestampMul * 10,
      value: data[0].value,
    });
    newData.push({
      timestamp: data[0].timestamp,
      value: data[0].value,
    });
    for (let i = 2; i < destinatedNumberOfPoints - 2; i++) {
      const indexPlace = i * destMul;
      const r = indexPlace % 1;
      const f = Math.floor(indexPlace);

      const firstValue = data[f].value * r;
      const secondValue = data[f + 1].value * (1 - r);

      let finalValue;
      if (firstValue === maxValue) {
        finalValue = maxValue;
      } else if (secondValue === minValue) {
        finalValue = minValue;
      } else {
        finalValue = firstValue + secondValue;
      }
      newData.push({
        timestamp: data[0].timestamp + i * timestampMul,
        value: finalValue,
      });
    }
    newData.push({
      timestamp: data[0].timestamp + destinatedNumberOfPoints * timestampMul,
      value: data[data.length - 1].value,
    });
    newData.push({
      timestamp:
        data[0].timestamp +
        destinatedNumberOfPoints * timestampMul +
        timestampMul * 10,
      value: data[data.length - 1].value,
    });
    return newData;
  }
};

const { BEGAN, ACTIVE, CANCELLED, END, FAILED, UNDETERMINED } = State;

const width = deviceUtils.dimensions.width;
const height = 170;
const chartPadding = 16;

const strokeWidth = 1.5;
const thickStrokeWidthDifference = 1.5;

const flipY = { transform: [{ scaleX: 1 }, { scaleY: -1 }] };

const indexInterval = 10;

const pickImportantPoints = array => {
  const result = [];
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

  const xs = [];
  const ys = [];
  result.forEach(point => {
    xs.push(point.x);
    ys.push(point.y);
  });

  return { xs, ys };
};

export default class Chart extends PureComponent {
  propTypes = {
    data: PropTypes.array,
    enableSelect: PropTypes.bool,
    mode: PropTypes.oneOf(['gesture-managed', 'detailed', 'simplified']),
  };

  constructor(props) {
    super(props);

    this.state = {
      allData: this.props.data.map(data =>
        simplifyChartData(data, this.props.amountOfPathPoints)
      ),
      currentData: simplifyChartData(
        this.props.data[0],
        this.props.amountOfPathPoints
      ),
      hideLoadingBar: false,
      isLoading: true,
      shouldRenderChart: true,
    };

    this.clock = new Clock();
    this.clockReversed = new Clock();
    this.opacityClock = new Clock();
    this.opacityClockReversed = new Clock();
    this.loadingClock = new Clock();
    this.loadingValue = new Value(1);
    this.gestureState = new Value(UNDETERMINED);
    this.panGestureState = new Value(UNDETERMINED);
    this.handle = undefined;
    this.value = new Value(this.props.mode === 'detailed' ? 0 : 1);
    this.opacity = new Value(0);
    this.shouldSpring = new Value(0);
    this.chartDay = new Value(1);
    this.chartWeek = new Value(0);
    this.chartMonth = new Value(0);
    this.chartYear = new Value(0);
    this.shouldReactToGestures = new Value(
      this.props.mode === 'gesture-managed' ? 1 : 0
    );

    this.currentInterval = 1;

    this.animatedPath = undefined;

    this._configUp = {
      duration: 500,
      easing: Easing.bezier(0.55, 0.06, 0.45, 0.94),
      toValue: 1,
    };
    this._configDown = {
      duration: 500,
      easing: Easing.bezier(0.55, 0.06, 0.45, 0.94),
      toValue: 0,
    };

    this.chartsMulti = [
      this.chartDay,
      this.chartWeek,
      this.chartMonth,
      this.chartYear,
    ];

    this.onTapGestureEvent = event([
      {
        nativeEvent: {
          state: state =>
            cond(
              or(eq(state, State.BEGAN), eq(state, State.END)),
              set(this.gestureState, state),
              delay(
                cond(
                  or(
                    neq(state, State.FAILED),
                    neq(this.panGestureState, State.ACTIVE)
                  ),
                  set(this.gestureState, state)
                ),
                100
              )
            ),
          x: x =>
            cond(
              and(greaterThan(x, 0), lessThan(x, width)),
              set(this.touchX, x)
            ),
        },
      },
    ]);

    this.onHandlerStateChange = event([
      {
        nativeEvent: {
          state: state =>
            block([
              set(this.panGestureState, state),
              cond(neq(ACTIVE, state), set(this.gestureState, state)),
            ]),
        },
      },
    ]);
  }

  componentDidMount = () => {
    setTimeout(() => {
      this.reloadChart(0, true);
    }, 1000);
  };

  getSnapshotBeforeUpdate() {
    if (this.currentInterval !== this.props.currentDataSource) {
      this.reloadChart(this.props.currentDataSource);
    }
  }
  touchX = new Value(0);
  lastTouchX = new Value(0);

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

  reloadChart = async (currentInterval, isInitial = false) => {
    if (currentInterval !== this.currentInterval) {
      let data = this.state.allData;
      if (isInitial) {
        data[currentInterval] = this.state.allData[currentInterval];
        await this.setState({
          isLoading: true,
        });

        this.animatedPath = this.createAnimatedPath();
      }
      setTimeout(async () => {
        Animated.timing(
          this.chartsMulti[this.currentInterval],
          this._configDown
        ).start();
        Animated.timing(
          this.chartsMulti[currentInterval],
          this._configUp
        ).start();
        this.currentInterval = currentInterval;

        await this.setState(prevState => ({
          currentData: prevState.allData[currentInterval],
          isLoading: false,
        }));
        this.props.onValueUpdate(
          this.state.allData[currentInterval][
            this.state.allData[currentInterval].length - 1
          ].value
        );
      });
    }
  };

  createAnimatedPath = () => {
    let splinePoints = [];
    for (let i = 0; i < this.state.allData.length; i++) {
      if (this.state.allData[i].length > 0) {
        const maxValue = maxBy(this.state.allData[i], 'value');
        const minValue = minBy(this.state.allData[i], 'value');

        const timestampLength =
          this.state.allData[i][this.state.allData[i].length - 1].timestamp -
          this.state.allData[i][0].timestamp;
        const xMultiply = width / timestampLength;

        const yMultiply = height / (maxValue.value - minValue.value);

        const points = this.state.allData[i].map(({ timestamp, value }) => ({
          x: (timestamp - this.state.allData[i][0].timestamp) * xMultiply,
          y: (value - minValue.value) * yMultiply,
        }));

        const importantPoints = pickImportantPoints(points);
        const spline = new Spline(importantPoints.xs, importantPoints.ys);
        splinePoints.push(
          points
            .map(({ x, y }) => {
              return { x, y1: y, y2: spline.at(x) };
            })
            .filter(Boolean)
        );
      } else {
        let emptyArray = new Array(this.props.amountOfPathPoints);
        for (let j = 0; j < emptyArray.length; j++) {
          emptyArray[j] = { x: 0, y1: 0, y2: 0 };
        }
        splinePoints.push(emptyArray);
      }
    }

    let chartNode = (multiplyNode, index, chartIndex) =>
      multiply(
        multiplyNode,
        add(
          splinePoints[chartIndex][index].y1,
          multiply(
            this.value,
            sub(
              splinePoints[chartIndex][index].y2,
              splinePoints[chartIndex][index].y1
            )
          )
        )
      );

    const allNodes = index =>
      this.props.data.map((value, i) => {
        return chartNode(this.chartsMulti[i], index, i);
      });

    const animatedPath = concat(
      'M -20 0',
      ...splinePoints[0].flatMap(({ x }, index) => [
        'L',
        x,
        ' ',
        add(...allNodes(index)),
      ])
    );

    return animatedPath;
  };

  checkValueBoundaries = value => {
    if (Math.abs(value) > width / 2 - 45) {
      return value > 0 ? value - 45 : value + 45;
    }
    return value;
  };

  render() {
    const { amountOfPathPoints } = this.props;
    let maxValue = 0,
      minValue = 0,
      change = 0,
      timePeriod = 0,
      maxValueDistance = 999,
      minValueDistance = 999;

    if (this.state.currentData.length > 0) {
      maxValue = maxBy(this.state.currentData, 'value');
      minValue = minBy(this.state.currentData, 'value');
      change =
        ((this.state.currentData[this.state.currentData.length - 1].value -
          this.state.currentData[0].value) /
          this.state.currentData[0].value) *
        100;

      timePeriod =
        this.state.currentData[this.state.currentData.length - 1].timestamp -
        this.state.currentData[0].timestamp;

      maxValueDistance = this.checkValueBoundaries(
        ((maxValue.timestamp - this.state.currentData[0].timestamp) /
          timePeriod) *
          width -
          width / 2
      );
      minValueDistance = this.checkValueBoundaries(
        ((minValue.timestamp - this.state.currentData[0].timestamp) /
          timePeriod) *
          width -
          width / 2
      );
    }

    return (
      <Fragment>
        <GestureWrapper
          enabled={this.props.enableSelect}
          onTapGestureEvent={this.onTapGestureEvent}
          onPanGestureEvent={this.onPanGestureEvent}
          onHandlerStateChange={this.onHandlerStateChange}
        >
          <Animated.View
            style={{
              justifyContent: 'flex-start',
            }}
          >
            <Animated.View
              style={{
                opacity: this.loadingValue,
              }}
            >
              <TimestampText
                style={{ transform: [{ translateX: maxValueDistance }] }}
              >
                ${Number(maxValue.value).toFixed(2)}
              </TimestampText>
            </Animated.View>
            <View style={{ flexDirection: 'row' }}>
              <View
                style={{
                  height: 200,
                  width,
                }}
              >
                <Svg
                  height={width}
                  width={width + 2}
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
                    d={this.animatedPath}
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
            <Animated.View
              style={{
                opacity: this.loadingValue,
              }}
            >
              <TimestampText
                style={{ transform: [{ translateX: minValueDistance }] }}
              >
                ${Number(minValue.value).toFixed(2)}
              </TimestampText>
            </Animated.View>
          </Animated.View>
        </GestureWrapper>
        {this.state.isLoading && (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#ffffffbb',
              height: 235,
              justifyContent: 'center',
              position: 'absolute',
              top: 100,
              width: width,
            }}
          >
            <ActivityIndicator />
          </View>
        )}
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
                  this.props.onValueUpdate(
                    this.state.currentData[this.state.currentData.length - 1]
                      .value
                  );
                }),
              ]),
              onChange(
                this.touchX,
                call([this.touchX], ([x]) => {
                  let curX = 0;
                  if (x < (width / (amountOfPathPoints + 20)) * 10) {
                    curX = 0;
                  } else if (
                    x >
                    width - (width / (amountOfPathPoints + 20)) * 10
                  ) {
                    curX = width - (width / (amountOfPathPoints + 20)) * 10 - 1;
                  } else {
                    curX =
                      x -
                      (width / (amountOfPathPoints + 20)) * 10 +
                      (x / width) * (width / (amountOfPathPoints + 20)) * 10;
                  }
                  const calculatedIndex = Math.floor(
                    curX /
                      ((width - (width / (amountOfPathPoints + 20)) * 10) /
                        this.state.currentData.length)
                  );
                  this.props.onValueUpdate(
                    this.state.currentData[calculatedIndex].value
                  );
                })
              )
            ),
            cond(this.shouldReactToGestures, [
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
            ]),
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
          ])}
        />
      </Fragment>
    );
  }
}
