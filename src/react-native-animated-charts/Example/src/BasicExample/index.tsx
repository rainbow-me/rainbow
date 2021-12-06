import {
  ChartDot,
  ChartPath,
  ChartPathProvider,
  monotoneCubicInterpolation,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
} from '@rainbow-me/animated-charts';
import React from 'react';
import {Dimensions, View} from 'react-native';

export const {width: SIZE} = Dimensions.get('window');

export const data = [
  {x: 1453075200, y: 1.47},
  {x: 1453161600, y: 1.37},
  {x: 1453248000, y: 1.53},
  {x: 1453334400, y: 1.54},
  {x: 1453420800, y: 1.52},
  {x: 1453507200, y: 2.03},
  {x: 1453593600, y: 2.1},
  {x: 1453680000, y: 2.5},
  {x: 1453766400, y: 2.3},
  {x: 1453852800, y: 2.42},
  {x: 1453939200, y: 2.55},
  {x: 1454025600, y: 2.41},
  {x: 1454112000, y: 2.43},
  {x: 1454198400, y: 2.2},
];

const points = monotoneCubicInterpolation({data, range: 40});

const BasicExample = () => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <View
    style={{
      backgroundColor: 'black',
    }}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <ChartPathProvider
      data={{
        points,
        smoothingStrategy: 'bezier',
      }}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChartPath height={SIZE / 2} stroke="yellow" width={SIZE} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChartDot
        style={{
          backgroundColor: 'blue',
        }}
      />
    </ChartPathProvider>
  </View>
);

export default BasicExample;
