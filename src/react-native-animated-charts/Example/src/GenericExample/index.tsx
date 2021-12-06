import {
  ChartDot,
  ChartPath,
  ChartPathProvider,
  ChartXLabel,
  ChartYLabel,
  monotoneCubicInterpolation,
  simplifyData,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
} from '@rainbow-me/animated-charts';
import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import bSplineInterpolation from '../../../src/interpolations/bSplineInterpolation';
import {data1, data2} from './data';

export const {width: SIZE} = Dimensions.get('window');

export const formatUSD = (value: any) => {
  'worklet';
  if (value === '') {
    return '';
  }
  return `$ ${value.toLocaleString('en-US', {
    currency: 'USD',
  })}`;
};

export const formatDatetime = (value: any) => {
  'worklet';
  if (value === '') {
    return '';
  }
  const date = new Date(Number(value * 1000));
  const s = date.getSeconds();
  const m = date.getMinutes();
  const h = date.getHours();
  const d = date.getDate();
  const n = date.getMonth();
  const y = date.getFullYear();
  return `${y}-${n}-${d} ${h}:${m}:${s}`;
};

function GenericExample() {
  const [
    smoothingWhileTransitioningEnabled,
    setSmoothingWhileTransitioningEnabled,
  ] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [data, setData] = useState({points: data1});
  const [dataSource, setDataSource] = useState(1);
  const [simplifying, setSimplifying] = useState(false);
  const [pickRange, setPickRange] = useState(10);
  const [includeExtremes, setIncludeExtremes] = useState(true);
  const [interpolationStrategy, setInterpolationStrategy] = useState('b');
  const [numberOfPointsInterpolated, setNumberOfPointsInterpolated] = useState(
    80
  );
  const [bSplineDegree, setBSplineDegree] = useState(3);
  const [smoothingStrategy, setSmoothingStrategy] = useState('none');
  const [smoothingFactor, setSmoothingFactor] = useState(0.05);
  const [hitSlop, setHitSlop] = useState(30);

  useEffect(() => {
    const rawData = dataSource === 1 ? data1 : data2;
    const simplifiedData = simplifying
      ? simplifyData(rawData, pickRange, includeExtremes)
      : rawData;
    const intepolatedData = (() => {
      // eslint-disable-next-line default-case
      switch (interpolationStrategy) {
        case 'none':
          return simplifiedData;
        case 'b':
          return bSplineInterpolation({
            data: simplifiedData,
            degree: bSplineDegree,
            range: numberOfPointsInterpolated,
          });
        case 'mono':
          return monotoneCubicInterpolation({
            data: simplifiedData,
            range: numberOfPointsInterpolated,
          });
      }
    })();
    const data = {
      points: intepolatedData,
      smoothingFactor: smoothingStrategy === 'none' ? 0 : smoothingFactor,
      smoothingStrategy,
    };
    setData(data);
  }, [
    bSplineDegree,
    dataSource,
    includeExtremes,
    interpolationStrategy,
    numberOfPointsInterpolated,
    pickRange,
    simplifying,
    smoothingFactor,
    smoothingStrategy,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View
      style={{
        backgroundColor: 'black',
      }}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ScrollView style={{backgroundColor: 'black'}}>
        {/*<Text style={{color: 'white', fontWeight: 'bold'}}>*/}
        {/*  Generic Example (swipe right for a real-life example)*/}
        {/*</Text>*/}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ChartPathProvider data={data}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ChartPath
            fill="none"
            hapticsEnabled={hapticsEnabled}
            height={SIZE / 2}
            hitSlop={hitSlop}
            smoothingWhileTransitioningEnabled={
              smoothingWhileTransitioningEnabled
            }
            stroke="red"
            strokeWidth="2"
            width={SIZE}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ChartDot
            style={{
              backgroundColor: 'blue',
            }}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ChartYLabel
            format={formatUSD}
            style={{backgroundColor: 'black', color: 'green', margin: 4}}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ChartXLabel
            format={formatDatetime}
            style={{backgroundColor: 'black', color: 'red', margin: 4}}
          />
        </ChartPathProvider>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text style={{color: 'white', fontWeight: 'bold'}}>Haptics:</Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setHapticsEnabled(true)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: hapticsEnabled ? 'lightgreen' : 'white',
              }}>
              Yes
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setHapticsEnabled(false)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: !hapticsEnabled ? 'lightgreen' : 'white',
              }}>
              No
            </Text>
          </TouchableOpacity>
        </View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Disable smoothing while transitioning:
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity
            onPress={() => setSmoothingWhileTransitioningEnabled(true)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: smoothingWhileTransitioningEnabled
                  ? 'lightgreen'
                  : 'white',
              }}>
              Yes
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity
            onPress={() => setSmoothingWhileTransitioningEnabled(false)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: !smoothingWhileTransitioningEnabled
                  ? 'lightgreen'
                  : 'white',
              }}>
              No
            </Text>
          </TouchableOpacity>
        </View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text style={{color: 'white', fontWeight: 'bold'}}>Soft margin:</Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setHitSlop(0)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: hitSlop === 0 ? 'lightgreen' : 'white',
              }}>
              0
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setHitSlop(30)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: hitSlop === 30 ? 'lightgreen' : 'white',
              }}>
              30
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setHitSlop(50)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: hitSlop === 50 ? 'lightgreen' : 'white',
              }}>
              50
            </Text>
          </TouchableOpacity>
        </View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text style={{color: 'white', fontWeight: 'bold'}}>Data source:</Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setDataSource(1)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: dataSource === 1 ? 'lightgreen' : 'white'}}>
              Data 1
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setDataSource(2)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: dataSource === 2 ? 'lightgreen' : 'white'}}>
              Data 2
            </Text>
          </TouchableOpacity>
        </View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text style={{color: 'white', fontWeight: 'bold'}}>Simplifying:</Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setSimplifying(true)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: simplifying ? 'lightgreen' : 'white'}}>
              Yes
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setSimplifying(false)}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: !simplifying ? 'lightgreen' : 'white'}}>
              No
            </Text>
          </TouchableOpacity>
        </View>
        {simplifying ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Pick range:
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setPickRange(2)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text style={{color: pickRange === 2 ? 'lightgreen' : 'white'}}>
                  2
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setPickRange(5)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text style={{color: pickRange === 5 ? 'lightgreen' : 'white'}}>
                  5
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setPickRange(10)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{color: pickRange === 10 ? 'lightgreen' : 'white'}}>
                  10
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setPickRange(25)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{color: pickRange === 25 ? 'lightgreen' : 'white'}}>
                  25
                </Text>
              </TouchableOpacity>
            </View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Include extremes:
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setIncludeExtremes(true)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text style={{color: includeExtremes ? 'lightgreen' : 'white'}}>
                  Yes
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setIncludeExtremes(false)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{color: !includeExtremes ? 'lightgreen' : 'white'}}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Interpolation strategy:
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setInterpolationStrategy('none')}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color:
                  interpolationStrategy === 'none' ? 'lightgreen' : 'white',
              }}>
              None
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setInterpolationStrategy('b')}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: interpolationStrategy === 'b' ? 'lightgreen' : 'white',
              }}>
              B Spline
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setInterpolationStrategy('mono')}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color:
                  interpolationStrategy === 'mono' ? 'lightgreen' : 'white',
              }}>
              Monotone Qubic Spline
            </Text>
          </TouchableOpacity>
        </View>
        {interpolationStrategy === 'b' ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              BSpline degree:
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setBSplineDegree(2)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: bSplineDegree === 2 ? 'lightgreen' : 'white',
                  }}>
                  2
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setBSplineDegree(3)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: bSplineDegree === 3 ? 'lightgreen' : 'white',
                  }}>
                  3
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setBSplineDegree(4)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: bSplineDegree === 4 ? 'lightgreen' : 'white',
                  }}>
                  4
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setBSplineDegree(5)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: bSplineDegree === 5 ? 'lightgreen' : 'white',
                  }}>
                  5
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        {interpolationStrategy !== 'none' ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Number of points Interpolated:
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(30)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 30
                        ? 'lightgreen'
                        : 'white',
                  }}>
                  30
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(80)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 80
                        ? 'lightgreen'
                        : 'white',
                  }}>
                  80
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(120)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 120
                        ? 'lightgreen'
                        : 'white',
                  }}>
                  120
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(200)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 200
                        ? 'lightgreen'
                        : 'white',
                  }}>
                  200
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Smoothing strategy:
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setSmoothingStrategy('none')}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: smoothingStrategy === 'none' ? 'lightgreen' : 'white',
              }}>
              None
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setSmoothingStrategy('simple')}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: smoothingStrategy === 'simple' ? 'lightgreen' : 'white',
              }}>
              Simple (Quadratic bezier with fixed points)
            </Text>
          </TouchableOpacity>
        </View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setSmoothingStrategy('complex')}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: smoothingStrategy === 'complex' ? 'lightgreen' : 'white',
              }}>
              Complex (Cubic bezier)
            </Text>
          </TouchableOpacity>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TouchableOpacity onPress={() => setSmoothingStrategy('bezier')}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              style={{
                color: smoothingStrategy === 'bezier' ? 'lightgreen' : 'white',
              }}>
              Bezier
            </Text>
          </TouchableOpacity>
        </View>
        {smoothingStrategy !== 'none' && smoothingStrategy !== 'bezier' ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Smoothing factor:
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setSmoothingFactor(0.05)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: smoothingFactor === 0.05 ? 'lightgreen' : 'white',
                  }}>
                  0.05
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setSmoothingFactor(0.1)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: smoothingFactor === 0.1 ? 'lightgreen' : 'white',
                  }}>
                  0.1
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setSmoothingFactor(0.2)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: smoothingFactor === 0.2 ? 'lightgreen' : 'white',
                  }}>
                  0.2
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setSmoothingFactor(0.3)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: smoothingFactor === 0.3 ? 'lightgreen' : 'white',
                  }}>
                  0.3
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setSmoothingFactor(0.5)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: smoothingFactor === 0.5 ? 'lightgreen' : 'white',
                  }}>
                  0.5
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setSmoothingFactor(0.7)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: smoothingFactor === 0.7 ? 'lightgreen' : 'white',
                  }}>
                  0.7
                </Text>
              </TouchableOpacity>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity onPress={() => setSmoothingFactor(0.9)}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  style={{
                    color: smoothingFactor === 0.9 ? 'lightgreen' : 'white',
                  }}>
                  0.9
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default GenericExample;
