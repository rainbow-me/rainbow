import React, { useEffect, useRef } from 'react';
import {
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
  Text,
  TextInput,
  View,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
const { RainbowSplashScreen, AnimatedNumbersManager } = NativeModules;

const Component = requireNativeComponent('AnimatedNumbers');
const Config = requireNativeComponent('AnimatedNumbersConfig');

RainbowSplashScreen ? RainbowSplashScreen.hideAnimated() : SplashScreen.hide();

export default function Animatable() {
  const ref = useRef();
  const configRef = useRef();

  useEffect(() => {
    const nodeHandle = findNodeHandle(ref.current.getNativeRef());
    AnimatedNumbersManager.animate(nodeHandle, { '1': 10 });
    return () => AnimatedNumbersManager.stop(nodeHandle);
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
        style={{
          width: 300,
          height: 30,
          backgroundColor: 'green',
          textAlign: 'right',
        }}
        //value="123"
      />
      <TextInput
        ref={ref}
        style={{
          backgroundColor: 'green',
          borderWidth: 2,
          fontVariant: ['tabular-nums'],
        }}
      >
        <Config prefix="DOLAR" ref={configRef} suffix="EURO" />
      </TextInput>
    </View>
  );
}
