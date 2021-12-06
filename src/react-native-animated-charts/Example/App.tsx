// eslint-disable-next-line import/default
import ViewPager from '@react-native-community/viewpager';
import React from 'react';
import {SafeAreaView} from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './src/BasicExample' was resolved to '/User... Remove this comment to see the full error message
import BasicExample from './src/BasicExample';
// @ts-expect-error ts-migrate(6142) FIXME: Module './src/GenericExample' was resolved to '/Us... Remove this comment to see the full error message
import Example from './src/GenericExample';
//import {default as RainbowExample} from './src/RainbowExample/value-chart/ChartExpandedState';

const App = () => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SafeAreaView style={{backgroundColor: 'black', flex: 1}}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ViewPager initialPage={0} style={{flex: 1}}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Example />
          {/*<RainbowExample />*/}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BasicExample />
        </ViewPager>
      </SafeAreaView>
    </>
  );
};

export default App;
