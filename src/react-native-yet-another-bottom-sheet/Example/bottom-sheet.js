import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useHideSplashScreen from '../../helpers/hideSplashScreen';
import { YABSForm, YABSScrollView } from '../index';

function Example() {
  return (
    <>
      {[
        'green',
        'blue',
        'grey',
        'silver',
        'green',
        'blue',
        'grey',
        'silver',
      ].map((color, i) => (
        <View
          key={`color ${i}`}
          style={{ backgroundColor: color, height: 150, width: '100%' }}
        >
          <Text>1</Text>
          <Text>2</Text>
          <Text>3</Text>
          <Text>4</Text>
        </View>
      ))}
    </>
  );
}

export default function YetAnotherBottomSheetExample() {
  const hideSplashScreen = useHideSplashScreen();
  useEffect(hideSplashScreen, [hideSplashScreen]);
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'red' }]}>
      <YABSForm
        points={[0, 300]}
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'blue',
            bottom: 0,
            top: 100,
          },
        ]}
      >
        <View
          style={{ backgroundColor: 'yellow', height: 40, width: '100%' }}
        />
        <YABSScrollView>
          <Example />
        </YABSScrollView>
      </YABSForm>
    </View>
  );
}
