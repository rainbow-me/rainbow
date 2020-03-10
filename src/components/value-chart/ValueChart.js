import Spline from 'cubic-spline';
import deepEqual from 'fbjs/lib/areEqual';
import { maxBy, minBy } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { View } from 'react-native';
import { State } from 'react-native-gesture-handler';
import Animated, { Clock, Easing, Value } from 'react-native-reanimated';
import { contains, delay, timing } from 'react-native-redash';
import Svg, { Circle, Path } from 'react-native-svg';
import { deviceUtils } from '../../utils';
import ActivityIndicator from '../ActivityIndicator';
import GestureWrapper from './GestureWrapper';
import TimestampText from './TimestampText';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const {
  and,
  or,
  eq,
  add,
  sub,
  onChange,
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

let allSegmentDividers = [];

const simplifyChartData = (data, destinatedNumberOfPoints) => {
  let allSegmentsPoints = [];
  let colors = [];
  let lines = [];
  let dividers = [];
  let lastPoints = [];
  let createdLastPoints = [];
  if (data.segments.length > 0) {
    for (let i = 0; i < data.segments.length; i++) {
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
      if (i * destMul > lastPoints[createdLastPoints.length]) {
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

    let data = {
      allPointsForData: allSegmentsPoints,
      colors,
      lastPoints: createdLastPoints,
      lines,
      points: newData,
      startSeparatator: dividers,
    };

    return data;
  }
};

const hexToRgb = hex => {
  // result contain table of [r, g, b] from given hex string
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

const { BEGAN, ACTIVE, CANCELLED, END, FAILED, UNDETERMINED } = State;

const width = deviceUtils.dimensions.width;
const height = 170;
const chartPadding = 16;

const flipY = { transform: [{ scaleX: 1 }, { scaleY: -1 }] };

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

    /* if important points are generated automaticaly in component */
    /* you can specify the graduality from important points */
    importantPointsIndexInterval: PropTypes.number,

    /* specify what kind of chart will be displayed */
    mode: PropTypes.oneOf(['gesture-managed', 'detailed', 'simplified']),

    /* callback that returns value of original data x for touched y */
    onValueUpdate: PropTypes.func,

    /* specify stroke width */
    stroke: PropTypes.object,
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

      currentData: this.data[0],
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

    /* table of animation values that are used to animate between different charts on the run. */
    /* only one can be set to 1 at the time because all charts are multiplied by this table and summed */
    this.chartAnimationValues = [
      new Value(1),
      new Value(0),
      new Value(0),
      new Value(0),
    ];

    this.currentInterval = 1;

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
    this.reloadChart(1, true);
  };

  getSnapshotBeforeUpdate(prevProps) {
    if (!deepEqual(prevProps.data, this.props.data)) {
      allSegmentDividers = [];
      this.reloadChart(this.currentInterval, true);
    }
    if (this.currentInterval !== this.props.currentDataSource) {
      this.currentChart.setValue(this.props.currentDataSource);
      this.touchX.setValue(deviceUtils.dimensions.width - 1);
      this.reloadChart(this.props.currentDataSource);
    }
  }

  componentWillUnmount = () => {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle)
    }
  };

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

  reloadChart = async (currentInterval, isNewData = false) => {
    if (isNewData) {
      const data = this.props.data.map(data =>
        simplifyChartData(data, this.props.amountOfPathPoints)
      );
      await this.setState({
        chartData: data,
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
    if (currentInterval !== this.currentInterval) {
      this.timeoutHandle = setTimeout(async () => {
        Animated.timing(
          this.chartAnimationValues[this.currentInterval],
          this._configDown
        ).start();
        // eslint-disable-next-line import/no-named-as-default-member
        Animated.timing(
          this.chartAnimationValues[currentInterval],
          this._configUp
        ).start();
        this.currentInterval = currentInterval;

        await this.setState(prevState => ({
          currentData: prevState.chartData[currentInterval],
          isLoading: false,
        }));
        this.props.onValueUpdate(
          this.state.chartData[currentInterval].points[
            this.state.chartData[currentInterval].points.length - 1
          ].y
        );
      });
    }
  };

  createSegmentColorsArray = (segments, data) => {
    let segmentColors = [];
    let segmentSwitch = [];
    for (let i = 0; i < segments.length + 1; i++) {
      segmentColors.push([]);
      segmentSwitch.push([]);
    }
    for (let i = 0; i < data.length; i++) {
      let dataIndex = 0;
      for (let j = 0; j < segments.length + 1; j++) {
        segmentColors[j].push(dataIndex);
        if (segments[j] === data[i].lastPoints[dataIndex]) {
          segmentSwitch[j].push(i);
          dataIndex++;
        }
      }
    }
    segmentSwitch.pop();
    return { colors: segmentColors, dividers: segmentSwitch };
  };

  createAnimatedPath = () => {
    let sectionEndPoints = [];
    const { chartData } = this.state;
    allSegmentDividers.sort(function(a, b) {
      return a - b;
    });
    let segmentsWithDeletedDuplicates = [];

    allSegmentDividers.forEach(function(x) {
      if (
        segmentsWithDeletedDuplicates.length === 0 ||
        segmentsWithDeletedDuplicates.slice(-1)[0] !== x
      )
        segmentsWithDeletedDuplicates.push(x);
    });
    allSegmentDividers = segmentsWithDeletedDuplicates;

    const segments = this.createSegmentColorsArray(
      allSegmentDividers,
      chartData
    );
    let splinePoints = [];
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].points.length > 0) {
        const maxValue = maxBy(chartData[i].points, 'y');
        const minValue = minBy(chartData[i].points, 'y');

        const timestampLength =
          chartData[i].points[chartData[i].points.length - 1].x -
          chartData[i].points[0].x;

        const xMultiply = width / timestampLength;

        const yMultiply = height / (maxValue.y - minValue.y);
        const points = chartData[i].points.map(({ x, y, isImportant }) => ({
          isImportant,
          x: (x - chartData[i].points[0].x) * xMultiply,
          y: (y - minValue.y) * yMultiply,
        }));

        const importantPoints = pickImportantPoints(
          points,
          this.props.importantPointsIndexInterval
        );
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

    const allNodes = index => {
      return chartData.map((_, i) => {
        return chartNode(this.chartAnimationValues[i], index, i);
      });
    };

    let returnPaths = [];
    let returnPoints = [];
    const localSegmentDividers = allSegmentDividers;
    for (let i = 0; i <= localSegmentDividers.length; i++) {
      const animatedPath = concat(
        'M 0 0',
        ...splinePoints[0].flatMap(({ x }, index) => {
          if (i === 0) {
            if (index <= localSegmentDividers[i]) {
              return ['L', x, ' ', add(...allNodes(index))];
            }
          } else {
            if (index === localSegmentDividers[i - 1]) {
              sectionEndPoints.push({
                index: segments.dividers[i - 1],
                opacity: this.chartAnimationValues[segments.dividers[i - 1]],
                x,
                y: add(...allNodes(index)),
              });
              return ['M', x, ' ', add(...allNodes(index))];
            }
            if (i === localSegmentDividers.length) {
              if (index >= localSegmentDividers[i - 1]) {
                return ['L', x, ' ', add(...allNodes(index))];
              }
            } else {
              if (
                index >= localSegmentDividers[i - 1] &&
                index <= localSegmentDividers[i]
              ) {
                return ['L', x, ' ', add(...allNodes(index))];
              }
            }
          }
        })
      );

      const colorMatrix = index => {
        return index < chartData.length - 1
          ? cond(
              eq(this.currentChart, index),
              Animated.color(
                ...hexToRgb(chartData[index].colors[segments.colors[i][index]])
              ),
              colorMatrix(index + 1)
            )
          : cond(
              eq(this.currentChart, index),
              Animated.color(
                ...hexToRgb(chartData[index].colors[segments.colors[i][index]])
              )
            );
      };

      const lineMatrix = index => {
        return index < chartData.length - 1
          ? cond(
              eq(this.currentChart, index),
              chartData[index].lines[segments.colors[i][index]],
              lineMatrix(index + 1)
            )
          : cond(
              eq(this.currentChart, index),
              chartData[index].lines[segments.colors[i][index]]
            );
      };

      returnPaths.push(
        <AnimatedPath
          key={i}
          id="main-path"
          fill="none"
          stroke={colorMatrix(0)}
          strokeDasharray={lineMatrix(0)}
          strokeWidth={add(
            this.props.stroke.detailed,
            multiply(
              this.value,
              sub(this.props.stroke.simplified, this.props.stroke.detailed)
            )
          )}
          strokeLinejoin="round"
          strokeLinecap="round"
          d={animatedPath}
        />
      );
    }

    let startingValues = [0, 0, 0, 0];
    sectionEndPoints.forEach(element => {
      if (
        chartData[element.index].startSeparatator[startingValues[element.index]]
      ) {
        returnPoints.push(
          <AnimatedCircle
            cx={element.x}
            cy={element.y}
            r={
              chartData[element.index].startSeparatator[
                startingValues[element.index]
              ].r
            }
            stroke={
              chartData[element.index].startSeparatator[
                startingValues[element.index]
              ].stroke
            }
            strokeWidth={
              chartData[element.index].startSeparatator[
                startingValues[element.index]
              ].strokeWidth
            }
            fill={
              chartData[element.index].startSeparatator[
                startingValues[element.index]++
              ].fill
            }
            opacity={element.opacity}
          />
        );
      }
    });

    return { paths: returnPaths, points: returnPoints };
  };

  checkValueBoundaries = value => {
    if (Math.abs(value) > width / 2 - 45) {
      return value > 0 ? value - 45 : value + 45;
    }
    return value;
  };
  render() {
    const { amountOfPathPoints } = this.props;
    const { currentData } = this.state;
    let maxValue = 0,
      minValue = 0,
      timePeriod = 0,
      maxValueDistance = 999,
      minValueDistance = 999;

    if (currentData.points.length > 0) {
      maxValue = maxBy(currentData.points, 'y');
      minValue = minBy(currentData.points, 'y');

      timePeriod =
        currentData.points[currentData.points.length - 1].x -
        currentData.points[0].x;

      maxValueDistance = this.checkValueBoundaries(
        ((maxValue.x - currentData.points[0].x) / timePeriod) * width -
          width / 2
      );
      minValueDistance = this.checkValueBoundaries(
        ((minValue.x - currentData.points[0].x) / timePeriod) * width -
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
                ${Number(maxValue.y).toFixed(2)}
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
                  {this.state.animatedPath}
                  {this.state.animatedDividers}
                </Svg>
              </View>
              <Animated.View
                style={[
                  {
                    backgroundColor: this.props.barColor,
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
                        translateX: Animated.add(this.touchX, new Value(-1.5)),
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
                ${Number(minValue.y).toFixed(2)}
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
                    currentData.points[currentData.points.length - 1].y
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
                        currentData.points.length)
                  );
                  this.props.onValueUpdate(
                    currentData.points[calculatedIndex].y
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
