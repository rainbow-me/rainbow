import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';
const { RainbowSplashScreen, AnimatedNumbersManager } = NativeModules;

const Config = requireNativeComponent('AnimatedNumbersConfig');

RainbowSplashScreen ? RainbowSplashScreen.hideAnimated() : SplashScreen.hide();

export default function Animatable() {
  const ref = useRef();

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
          ref.current.animate({
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
          ref.current.animate({
            stepPerSecond: 2,
            toValue: 5,
          });
        }}
        title="Animate to 5"
      >
        <Text>Animate down to 5</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          ref.current.animate({
            stepPerSecond: 3,
          });
        }}
        title="Animate to Inf"
      >
        <Text>Animate to inf</Text>
      </TouchableOpacity>

      <AnimatedNumberWrapped
        initialValue={0.5}
        pad="right"
        prefix="X"
        ref={ref}
      />
    </View>
  );
}

function AnimatedNumbers(
  { initialValue = 0.0, prefix, suffix, style, pad, ...props },
  ref
) {
  const inputRef = useRef();
  const configRef = useRef();
  useEffect(() => {
    currentAnimation.current?.();
    const nodeHandle = findNodeHandle(inputRef.current.getNativeRef());
    const configHandle = findNodeHandle(configRef.current);
    AnimatedNumbersManager.animate(nodeHandle, configHandle, {
      framesPerSecond: 100,
      stepPerSecond: initialValue * 1000,
      toValue: initialValue,
    });
  }, [initialValue, ref]);

  const currentAnimation = useRef();

  useImperativeHandle(ref, () => ({
    animate: (config = {}) => {
      currentAnimation.current?.();
      const nodeHandle = findNodeHandle(inputRef.current.getNativeRef());
      const configHandle = findNodeHandle(configRef.current);
      AnimatedNumbersManager.animate(nodeHandle, configHandle, config);
      currentAnimation.current = () => AnimatedNumbersManager.stop(nodeHandle);
      return () => currentAnimation.current?.();
    },
    stop: () => {
      currentAnimation.current?.();
    },
  }));

  return (
    <>
      <TextInput
        editable={false}
        ref={inputRef}
        style={[{ fontVariant: ['tabular-nums'] }, style]}
        {...props}
      />
      <Config pad={pad} prefix={prefix} ref={configRef} suffix={suffix} />
    </>
  );
}

const AnimatedNumberWrapped = forwardRef(AnimatedNumbers);
