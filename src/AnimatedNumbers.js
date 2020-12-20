import React, { useEffect, useRef } from 'react';
import {
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
  TextInput,
  View,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
const { RainbowSplashScreen, AnimatedNumbersManager } = NativeModules;

const Component = requireNativeComponent('AnimatedNumbers');

RainbowSplashScreen ? RainbowSplashScreen.hideAnimated() : SplashScreen.hide();

export default function Animatable() {
  const ref = useRef();

  useEffect(() => {
    const nodeHandle = findNodeHandle(ref.current.getNativeRef());
    AnimatedNumbersManager.animate(nodeHandle, { '1': 10 });
  }, []);

  return (
    <View
      style={{
        backgroundColor: 'red',
        height: 200,
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Component
        style={{ width: 30, height: 30, backgroundColor: 'green' }}
        text="123"
      />
      <TextInput
        ref={ref}
        style={{ backgroundColor: 'green', borderWidth: 2 }}
        value="!@#"
      />
    </View>
  );
}
