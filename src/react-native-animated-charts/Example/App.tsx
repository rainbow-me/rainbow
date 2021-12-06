// eslint-disable-next-line import/default
import ViewPager from '@react-native-community/viewpager';
import React from 'react';
import {SafeAreaView} from 'react-native';
import BasicExample from './src/BasicExample';
import Example from './src/GenericExample';
//import {default as RainbowExample} from './src/RainbowExample/value-chart/ChartExpandedState';

const App = () => {
  return (
    <>
      <SafeAreaView style={{backgroundColor: 'black', flex: 1}}>
        <ViewPager initialPage={0} style={{flex: 1}}>
          <Example />
          {/*<RainbowExample />*/}
          <BasicExample />
        </ViewPager>
      </SafeAreaView>
    </>
  );
};

export default App;
