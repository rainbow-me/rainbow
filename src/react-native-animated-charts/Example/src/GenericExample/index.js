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
import {
  ChartDot,
  ChartPath,
  ChartPathProvider,
  ChartXLabel,
  ChartYLabel,
  monotoneCubicInterpolation,
  simplifyData,
} from '@/react-native-animated-charts/src';

export const {width: SIZE} = Dimensions.get('window');

export const formatUSD = (value) => {
  'worklet';
  if (value === '') {
    return '';
  }
  return `$ ${value.toLocaleString('en-US', {
    currency: 'USD',
  })}`;
};

export const formatDatetime = (value) => {
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
  const [numberOfPointsInterpolated, setNumberOfPointsInterpolated] =
    useState(80);
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
    <View
      style={{
        backgroundColor: 'black',
      }}
    >
      <ScrollView style={{backgroundColor: 'black'}}>
        {/*<Text style={{color: 'white', fontWeight: 'bold'}}>*/}
        {/*  Generic Example (swipe right for a real-life example)*/}
        {/*</Text>*/}
        <ChartPathProvider data={data}>
          <ChartPath
            hapticsEnabled={hapticsEnabled}
            hitSlop={hitSlop}
            smoothingWhileTransitioningEnabled={
              smoothingWhileTransitioningEnabled
            }
            fill="none"
            height={SIZE / 2}
            stroke="red"
            strokeWidth="2"
            width={SIZE}
          />
          <ChartDot
            style={{
              backgroundColor: 'blue',
            }}
          />
          <ChartYLabel
            format={formatUSD}
            style={{backgroundColor: 'black', color: 'green', margin: 4}}
          />
          <ChartXLabel
            format={formatDatetime}
            style={{backgroundColor: 'black', color: 'red', margin: 4}}
          />
        </ChartPathProvider>
        <Text style={{color: 'white', fontWeight: 'bold'}}>Haptics:</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity onPress={() => setHapticsEnabled(true)}>
            <Text
              style={{
                color: hapticsEnabled ? 'lightgreen' : 'white',
              }}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHapticsEnabled(false)}>
            <Text
              style={{
                color: !hapticsEnabled ? 'lightgreen' : 'white',
              }}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Disable smoothing while transitioning:
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity
            onPress={() => setSmoothingWhileTransitioningEnabled(true)}
          >
            <Text
              style={{
                color: smoothingWhileTransitioningEnabled
                  ? 'lightgreen'
                  : 'white',
              }}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSmoothingWhileTransitioningEnabled(false)}
          >
            <Text
              style={{
                color: !smoothingWhileTransitioningEnabled
                  ? 'lightgreen'
                  : 'white',
              }}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{color: 'white', fontWeight: 'bold'}}>Soft margin:</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity onPress={() => setHitSlop(0)}>
            <Text
              style={{
                color: hitSlop === 0 ? 'lightgreen' : 'white',
              }}
            >
              0
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHitSlop(30)}>
            <Text
              style={{
                color: hitSlop === 30 ? 'lightgreen' : 'white',
              }}
            >
              30
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHitSlop(50)}>
            <Text
              style={{
                color: hitSlop === 50 ? 'lightgreen' : 'white',
              }}
            >
              50
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{color: 'white', fontWeight: 'bold'}}>Data source:</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity onPress={() => setDataSource(1)}>
            <Text style={{color: dataSource === 1 ? 'lightgreen' : 'white'}}>
              Data 1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDataSource(2)}>
            <Text style={{color: dataSource === 2 ? 'lightgreen' : 'white'}}>
              Data 2
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{color: 'white', fontWeight: 'bold'}}>Simplifying:</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity onPress={() => setSimplifying(true)}>
            <Text style={{color: simplifying ? 'lightgreen' : 'white'}}>
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSimplifying(false)}>
            <Text style={{color: !simplifying ? 'lightgreen' : 'white'}}>
              No
            </Text>
          </TouchableOpacity>
        </View>
        {simplifying ? (
          <>
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Pick range:
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}
            >
              <TouchableOpacity onPress={() => setPickRange(2)}>
                <Text style={{color: pickRange === 2 ? 'lightgreen' : 'white'}}>
                  2
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickRange(5)}>
                <Text style={{color: pickRange === 5 ? 'lightgreen' : 'white'}}>
                  5
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickRange(10)}>
                <Text
                  style={{color: pickRange === 10 ? 'lightgreen' : 'white'}}
                >
                  10
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickRange(25)}>
                <Text
                  style={{color: pickRange === 25 ? 'lightgreen' : 'white'}}
                >
                  25
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Include extremes:
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}
            >
              <TouchableOpacity onPress={() => setIncludeExtremes(true)}>
                <Text style={{color: includeExtremes ? 'lightgreen' : 'white'}}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIncludeExtremes(false)}>
                <Text
                  style={{color: !includeExtremes ? 'lightgreen' : 'white'}}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Interpolation strategy:
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity onPress={() => setInterpolationStrategy('none')}>
            <Text
              style={{
                color:
                  interpolationStrategy === 'none' ? 'lightgreen' : 'white',
              }}
            >
              None
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInterpolationStrategy('b')}>
            <Text
              style={{
                color: interpolationStrategy === 'b' ? 'lightgreen' : 'white',
              }}
            >
              B Spline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInterpolationStrategy('mono')}>
            <Text
              style={{
                color:
                  interpolationStrategy === 'mono' ? 'lightgreen' : 'white',
              }}
            >
              Monotone Qubic Spline
            </Text>
          </TouchableOpacity>
        </View>
        {interpolationStrategy === 'b' ? (
          <>
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              BSpline degree:
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}
            >
              <TouchableOpacity onPress={() => setBSplineDegree(2)}>
                <Text
                  style={{
                    color: bSplineDegree === 2 ? 'lightgreen' : 'white',
                  }}
                >
                  2
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBSplineDegree(3)}>
                <Text
                  style={{
                    color: bSplineDegree === 3 ? 'lightgreen' : 'white',
                  }}
                >
                  3
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBSplineDegree(4)}>
                <Text
                  style={{
                    color: bSplineDegree === 4 ? 'lightgreen' : 'white',
                  }}
                >
                  4
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBSplineDegree(5)}>
                <Text
                  style={{
                    color: bSplineDegree === 5 ? 'lightgreen' : 'white',
                  }}
                >
                  5
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        {interpolationStrategy !== 'none' ? (
          <>
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Number of points Interpolated:
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}
            >
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(30)}
              >
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 30
                        ? 'lightgreen'
                        : 'white',
                  }}
                >
                  30
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(80)}
              >
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 80
                        ? 'lightgreen'
                        : 'white',
                  }}
                >
                  80
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(120)}
              >
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 120
                        ? 'lightgreen'
                        : 'white',
                  }}
                >
                  120
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNumberOfPointsInterpolated(200)}
              >
                <Text
                  style={{
                    color:
                      numberOfPointsInterpolated === 200
                        ? 'lightgreen'
                        : 'white',
                  }}
                >
                  200
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          Smoothing strategy:
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity onPress={() => setSmoothingStrategy('none')}>
            <Text
              style={{
                color: smoothingStrategy === 'none' ? 'lightgreen' : 'white',
              }}
            >
              None
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSmoothingStrategy('simple')}>
            <Text
              style={{
                color: smoothingStrategy === 'simple' ? 'lightgreen' : 'white',
              }}
            >
              Simple (Quadratic bezier with fixed points)
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <TouchableOpacity onPress={() => setSmoothingStrategy('complex')}>
            <Text
              style={{
                color: smoothingStrategy === 'complex' ? 'lightgreen' : 'white',
              }}
            >
              Complex (Cubic bezier)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSmoothingStrategy('bezier')}>
            <Text
              style={{
                color: smoothingStrategy === 'bezier' ? 'lightgreen' : 'white',
              }}
            >
              Bezier
            </Text>
          </TouchableOpacity>
        </View>
        {smoothingStrategy !== 'none' && smoothingStrategy !== 'bezier' ? (
          <>
            <Text style={{color: 'white', fontStyle: 'italic'}}>
              Smoothing factor:
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-around'}}
            >
              <TouchableOpacity onPress={() => setSmoothingFactor(0.05)}>
                <Text
                  style={{
                    color: smoothingFactor === 0.05 ? 'lightgreen' : 'white',
                  }}
                >
                  0.05
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSmoothingFactor(0.1)}>
                <Text
                  style={{
                    color: smoothingFactor === 0.1 ? 'lightgreen' : 'white',
                  }}
                >
                  0.1
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSmoothingFactor(0.2)}>
                <Text
                  style={{
                    color: smoothingFactor === 0.2 ? 'lightgreen' : 'white',
                  }}
                >
                  0.2
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSmoothingFactor(0.3)}>
                <Text
                  style={{
                    color: smoothingFactor === 0.3 ? 'lightgreen' : 'white',
                  }}
                >
                  0.3
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSmoothingFactor(0.5)}>
                <Text
                  style={{
                    color: smoothingFactor === 0.5 ? 'lightgreen' : 'white',
                  }}
                >
                  0.5
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSmoothingFactor(0.7)}>
                <Text
                  style={{
                    color: smoothingFactor === 0.7 ? 'lightgreen' : 'white',
                  }}
                >
                  0.7
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSmoothingFactor(0.9)}>
                <Text
                  style={{
                    color: smoothingFactor === 0.9 ? 'lightgreen' : 'white',
                  }}
                >
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
