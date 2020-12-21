import React, { useEffect, useRef } from 'react';
import {
  Button,
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';
import { fonts } from '@rainbow-me/styles';
const { RainbowSplashScreen, AnimatedNumbersManager } = NativeModules;

const Component = requireNativeComponent('AnimatedNumbers');
const Config = requireNativeComponent('AnimatedNumbersConfig');

RainbowSplashScreen ? RainbowSplashScreen.hideAnimated() : SplashScreen.hide();

function animate(ref, config) {
  const nodeHandle = findNodeHandle(ref.getNativeRef());
  AnimatedNumbersManager.animate(nodeHandle, config);
  return () => AnimatedNumbersManager.stop(nodeHandle);
}

export default function Animatable() {
  const ref = useRef();
  const configRef = useRef();
  const currentAnimation = useRef();

  return (
    <View
      style={{
        backgroundColor: 'red',
        height: 200,
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <TouchableOpacity
        onPress={() => {
          currentAnimation.current?.();
          currentAnimation.current = animate(ref.current, {
            stepPerSecond: 2,
            toValue: 10,
          });
        }}
        title="Animate to 10"
      >
        <Text>Animate to 10</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          currentAnimation.current?.();
          currentAnimation.current = animate(ref.current, {
            stepPerSecond: -2,
            toValue: 5,
          });
        }}
        title="Animate down to 5"
      >
        <Text>Animate down to 5</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          currentAnimation.current?.();
          currentAnimation.current = animate(ref.current, {
            stepPerSecond: 3,
          });
        }}
        title="Animate to Inf"
      >
        <Text>Animate to inf</Text>
      </TouchableOpacity>

      <TextInput
        editable={false}
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
