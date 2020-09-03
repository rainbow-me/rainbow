// eslint-disable-next-line import/default
import ViewPager from '@react-native-community/viewpager';
import React from 'react';
import {SafeAreaView} from 'react-native';
import Example from './src/GenericExample/Example';
//import {default as RainbowExample} from './src/RainbowExample/value-chart/ChartExpandedState';

const App = () => {
  return (
    <>
      <SafeAreaView style={{backgroundColor: 'black', flex: 1}}>
        <ViewPager initialPage={0} style={{flex: 1}}>
          <Example />
          {/*<RainbowExample />*/}
        </ViewPager>
      </SafeAreaView>
    </>
  );
};

export default App;
