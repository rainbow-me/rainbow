import { format } from 'date-fns';
import deepEqual from 'fbjs/lib/areEqual';
import { maxBy, minBy } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { State } from 'react-native-gesture-handler';
import Animated, { Clock, Easing, Value } from 'react-native-reanimated';
import { contains, delay, getPointAtLength, timing } from 'react-native-redash';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { deviceUtils } from '../../utils';
import ActivityIndicator from '../ActivityIndicator';
import { Centered, Column, Row } from '../layout';
import AnimatedChart from './AnimatedChart';
import GestureWrapper from './GestureWrapper';
import TimestampText from './TimestampText';

const formatDate = date => format(new Date(date), 'MMM dd hh:mm aa');

const {
  and,
  block,
  call,
  cond,
  eq,
  event,
  Extrapolate,
  greaterOrEq,
  greaterThan,
  interpolate,
  lessThan,
  multiply,
  neq,
  onChange,
  or,
  set,
  stopClock,
  sub,
} = Animated;

let allSegmentDividers = [];

const simplifyChartData = (data, destinatedNumberOfPoints) => {
  let allSegmentsPoints = [];
  let colors = [];
  let lines = [];
  let dividers = [];
  let lastPoints = [];
  let createdLastPoints = [];

  if (data.segments.length > 0) {
    for (let i = 0; i < 1; i++) {
      allSegmentsPoints = allSegmentsPoints.concat(data.segments[i].points);
      allSegmentsPoints[allSegmentsPoints.length - 1] = {
        ...allSegmentsPoints[allSegmentsPoints.length - 1],
        lastPoint: true,
      };
      lastPoints.push(allSegmentsPoints.length - 1);
      colors.push(data.segments[i].color);
      lines.push(data.segments[i].line);
      dividers.push(data.segments[i].renderStartSeparator);
    }
  }
  if (allSegmentsPoints.length > destinatedNumberOfPoints) {
    let destMul = allSegmentsPoints.length / destinatedNumberOfPoints;
    const maxValue = maxBy(allSegmentsPoints, 'y');
    const minValue = minBy(allSegmentsPoints, 'y');

    const xMul = Math.floor(
      (allSegmentsPoints[allSegmentsPoints.length - 1].x -
        allSegmentsPoints[0].x) /
        allSegmentsPoints.length
    );
    let newData = [];
    newData.push({
      isImportant: true,
      x: allSegmentsPoints[0].x - xMul * 2,
      y: allSegmentsPoints[0].y,
    });
    for (let i = 1; i < destinatedNumberOfPoints - 1; i++) {
      const indexPlace = i * destMul;
      const r = indexPlace % 1;
      const f = Math.floor(indexPlace);

      const firstValue = allSegmentsPoints[f].y * r;
      const secondValue = allSegmentsPoints[f + 1].y * (1 - r);

      let finalValue;
      if (firstValue === maxValue) {
        finalValue = maxValue;
      } else if (secondValue === minValue) {
        finalValue = minValue;
      } else {
        finalValue = firstValue + secondValue;
      }
      if (indexPlace > lastPoints[createdLastPoints.length]) {
        createdLastPoints.push(newData.length);
      }
      newData.push({
        isImportant:
          (allSegmentsPoints[f].isImportant ||
            allSegmentsPoints[f + 1].isImportant) &&
          !newData[newData.length - 1].isImportant,
        x: allSegmentsPoints[0].x + i * xMul,
        y: finalValue,
      });
    }
    newData.push({
      isImportant: true,
      x: allSegmentsPoints[0].x + destinatedNumberOfPoints * xMul + xMul * 2,
      y: allSegmentsPoints[allSegmentsPoints.length - 1].y,
    });

    allSegmentDividers = allSegmentDividers.concat(createdLastPoints);

    return {
      allPointsForData: allSegmentsPoints,
      colors,
      lastPoints: createdLastPoints,
      lines,
      points: newData,
      startSeparatator: dividers,
    };
  } else if (allSegmentsPoints.length > 1) {
    return {
      allPointsForData: allSegmentsPoints,
      colors,
      lastPoints: createdLastPoints,
      lines,
      points: allSegmentsPoints,
      startSeparatator: dividers,
    };
  }
};

const { BEGAN, ACTIVE, CANCELLED, END, FAILED, UNDETERMINED } = State;

const width = deviceUtils.dimensions.width;

export default class Chart extends PureComponent {
  static propTypes = {
    /* amount of points that data is simplified to. */
    /* to make animation between charts possible we need to have fixed amount of points in each chart */
    /* if provided data doesn't have perfect amount of points we can simplify it to fixed value */
    amountOfPathPoints: PropTypes.number,

    /* touch bar color */
    barColor: PropTypes.string,

    /* index of currently visible data chart */
    currentDataSource: PropTypes.number,

    /* chart data JSON */
    data: PropTypes.arrayOf({
      name: PropTypes.number,
      segments: PropTypes.arrayOf({
        color: PropTypes.string,
        line: PropTypes.number,
        points: PropTypes.arrayOf({
          x: PropTypes.number,
          y: PropTypes.number,
        }),
        renderStartSeparator: {
          fill: PropTypes.string,
          r: PropTypes.number,
          stroke: PropTypes.string,
          strokeWidth: PropTypes.number,
        },
      }),
    }),

    /* flag  that specify if gestures are active on chart */
    enableSelect: PropTypes.bool,

    /* specify what kind of chart will be displayed */
    mode: PropTypes.oneOf(['gesture-managed', 'detailed', 'simplified']),
  };

  static defaultProps = {
    enableSelect: true,
    importantPointsIndexInterval: 10,
    mode: 'gesture-managed',
    stroke: { detailed: 1.5, simplified: 3 },
  };

  constructor(props) {
    super(props);

    allSegmentDividers = [];
    this.data = this.props.data.map(data =>
      simplifyChartData(data, this.props.amountOfPathPoints)
    );

    this.state = {
      animatedDividers: undefined,
      animatedPath: undefined,
      chartData: this.data,
      currentData: this.data[3],
      hideLoadingBar: false,
      isLoading: true,
      shouldRenderChart: true,
    };

    /* clocks and value responsible for animation of the chart between simplified and detailed chart */
    this.clock = new Clock();
    this.clockReversed = new Clock();
    this.value = new Value(this.props.mode === 'detailed' ? 0 : 1);

    /* clocks and value responsible for opacity animation of the indicator bar */
    this.opacityClock = new Clock();
    this.opacityClockReversed = new Clock();
    this.opacity = new Value(0);

    /* value that control opacity of the chart during loading */
    this.loadingValue = new Value(1);

    /* two different gesture states one for tapGestureHandler and one for panGestureHandler respectively */
    this.gestureState = new Value(UNDETERMINED);
    this.panGestureState = new Value(UNDETERMINED);

    /* value that is used in reanimated code to recognize if values should animate to default values */
    this.shouldSpring = new Value(0);

    /* value that mirror string prop to the reanimated code */
    this.shouldReactToGestures = new Value(
      this.props.mode === 'gesture-managed' ? 1 : 0
    );

    /* value that point currently selected chart */
    this.currentChart = new Value(0);

    this.currentInterval = 'h';

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

    this.onTapGestureEvent = event([
      {
        nativeEvent: {
          state: state =>
            cond(
              or(
                eq(state, State.BEGAN),
                eq(state, State.END),
                eq(state, State.CANCELLED)
              ),
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
              block([set(this.touchX, x)])
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
    this.reloadChart(0, true);
    this.props.chartDateRef.current.setNativeProps({
      text: 'Today',
    });
    this.props.chartPriceRef.current.setNativeProps({
      text: `${this.props.nativeCurrency}${this.props.currentValue
        .toFixed(5)
        .toString()}`,
    });
  };

  getSnapshotBeforeUpdate(prevProps) {
    if (!deepEqual(prevProps.data, this.props.data)) {
      allSegmentDividers = [];
      this.reloadChart(this.currentInterval, true);
    }
    if (this.currentInterval !== this.props.currentDataSource) {
      this.currentInterval = this.props.currentDataSource;
      this.currentChart.setValue(this.props.currentDataSource);
      this.touchX.setValue(deviceUtils.dimensions.width - 1);
      this.reloadChart(this.props.currentDataSource, true);
    }
  }

  componentWillUnmount = () => {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
  };

  touchX = new Value(0);
  lastTouchX = new Value(0);
  translateX = new Value(0);
  translateY = new Value(0);

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

  reloadChart = async (currentInterval, isNewData = false) => {
    if (isNewData) {
      const data = this.props.data.map(data =>
        simplifyChartData(data, this.props.amountOfPathPoints)
      );
      let index = 0;
      await this.setState({
        chartData: data,
        currentData: data[index],
        isLoading: true,
      });
      this.timeoutHandle = setTimeout(async () => {
        const createdSVG = this.createAnimatedPath();
        await this.setState({
          animatedDividers: createdSVG.points,
          animatedPath: createdSVG.paths,
          isLoading: false,
        });
      });
    }
  };

  checkValueBoundaries = value => {
    if (Math.abs(value) > width / 2 - 45) {
      return value > 0 ? value - 45 : value + 45;
    }
    return value;
  };

  render() {
    const { barColor, currentValue, nativeCurrency } = this.props;
    const { currentData } = this.state;
    let maxValue = 0,
      minValue = 0,
      timePeriod = 0,
      maxValueDistance = 999,
      minValueDistance = 999;

    const points = currentData?.points;
    if (points && points.length > 0) {
      maxValue = maxBy(points, 'y');
      minValue = minBy(points, 'y');

      timePeriod = points[points.length - 1].x - points[0].x;

      maxValueDistance = this.checkValueBoundaries(
        ((maxValue.x - points[0].x) / timePeriod) * width - width / 2
      );
      minValueDistance = this.checkValueBoundaries(
        ((minValue.x - points[0].x) / timePeriod) * width - width / 2
      );
    }

    return (
      <Fragment>
        <GestureWrapper
          enabled={this.props.enableSelect}
          onHandlerStateChange={this.onHandlerStateChange}
          onPanGestureEvent={this.onPanGestureEvent}
          onTapGestureEvent={this.onTapGestureEvent}
        >
          <TimestampText
            style={{ transform: [{ translateX: maxValueDistance }] }}
          >
            ${Number(maxValue.y).toFixed(2)}
          </TimestampText>
          <Centered
            style={{
              backgroundColor: '#ffffffbb',
              height: 200,
              opacity: points ? 0 : 1,
              position: 'absolute',
              width: width,
            }}
          >
            <ActivityIndicator />
          </Centered>
          <Column opacity={points ? 1 : 0.5}>
            <AnimatedChart
              animatedValue={this.value}
              color={barColor}
              currentData={currentData}
              currentValue={currentValue}
              setCurrentPath={path => {
                const magneticPadding = 50;
                const calculatedTouchX = interpolate(this.touchX, {
                  extrapolate: Extrapolate.CLAMP,
                  inputRange: [
                    magneticPadding / 2,
                    magneticPadding,
                    width - magneticPadding,
                    width - magneticPadding / 2,
                  ],
                  outputRange: [
                    0,
                    magneticPadding,
                    width - magneticPadding,
                    width,
                  ],
                });
                const length = interpolate(calculatedTouchX, {
                  extrapolate: Extrapolate.CLAMP,
                  inputRange: path.p0x,
                  outputRange: path.start,
                });
                const { x, y } = getPointAtLength(path, length);
                this.translateY = multiply(y, -1);
                this.translateX = x;
                this.opacity.setValue(0);
                this.setState({ path });
              }}
            />
          </Column>
          <Row height={180}>
            <Animated.View
              style={[
                {
                  backgroundColor: this.props.barColor,
                  borderRadius: 8,
                  height: 16,
                  marginTop: 162,
                  position: 'absolute',
                  width: 16,
                  zIndex: 10,
                },
                {
                  opacity: cond(this.touchX, this.opacity, 0),
                  transform: [
                    {
                      translateX: sub(this.translateX, 8),
                      translateY: this.translateY,
                    },
                  ],
                },
              ]}
            />
          </Row>
          <TimestampText
            style={{ transform: [{ translateX: minValueDistance }] }}
          >
            ${Number(minValue.y).toFixed(2)}
          </TimestampText>
        </GestureWrapper>
        <Animated.Code
          exec={block([
            cond(
              or(eq(this.gestureState, ACTIVE), eq(this.gestureState, BEGAN)),
              set(this.shouldSpring, 1)
            ),
            cond(
              contains([FAILED, CANCELLED, END], this.gestureState),
              block([
                call([], () => {
                  // When user stops interacting with charts, reset the
                  // "currently selected value" back to the newest possible price.
                  // This is the value displayed in <ValueText />
                  const points = currentData?.points;
                  if (points) {
                    this.props.chartDateRef.current.setNativeProps({
                      text: 'Today',
                    });
                    this.props.chartPriceRef.current.setNativeProps({
                      text: convertAmountToNativeDisplay(
                        points[points.length - 1].y,
                        nativeCurrency
                      ),
                    });
                  }
                }),
                set(this.shouldSpring, 0),
              ]),
              onChange(
                this.touchX,
                call([this.translateX, this.translateY], ([x, y]) => {
                  const curX = x - (x % 10);
                  if (curX !== this.currentX) {
                    this.currentX = curX;
                    const max = maxValue.y;
                    const min = minValue.y;
                    const height = 160;
                    const points = currentData?.points;
                    if (points) {
                      const maxDate = points[points.length - 1].x;
                      const minDate = points[0].x;
                      const multiplierX = (maxDate - minDate) / width;
                      const multiplierY = (max - min) / height;
                      const date = x * multiplierX + minDate;
                      let result = -y * multiplierY + min;
                      if (result > max) {
                        result = max;
                      } else if (result < min) {
                        result = min;
                      }
                      this.props.chartDateRef.current.setNativeProps({
                        text: formatDate(date * 1000),
                      });
                      this.props.chartPriceRef.current.setNativeProps({
                        text: convertAmountToNativeDisplay(
                          result,
                          nativeCurrency
                        ),
                      });
                    }
                  }
                })
              )
            ),
            cond(
              and(lessThan(this.opacity, 1), eq(this.shouldSpring, 1)),
              block([
                set(
                  this.opacity,
                  timing({
                    clock: this.opacityClock,
                    duration: 150,
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
                    duration: 150,
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
