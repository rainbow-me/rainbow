import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

declare const global: {
  frameTimestamps: number[];
  __frameTimestamp: number;
};

declare const _WORKLET: boolean;

export default function FpsCounter() {
  const [state, setState] = useState(false);
  const x = useSharedValue(0);

  useEffect(() => {
    runOnUI(() => {
      'worklet';
      global.frameTimestamps = [];
    })();
    x.value = withSpring(state ? 360 : 0);
  }, [state, x]);

  const handlePress = () => {
    setState(state => !state);
  };

  const styles = useAnimatedStyle(() => {
    if (_WORKLET) {
      const now = global.__frameTimestamp;
      global.frameTimestamps.push(now);
      if (global.frameTimestamps.length >= 20) {
        const first = global.frameTimestamps.shift() || 0;
        const fps = (1000 / (now - first)) * global.frameTimestamps.length;
        console.log(`${fps.toFixed(3)} fps`);
      }
    }

    return {
      transform: [{ rotate: `${x.value}deg` }],
    };
  });

  return (
    <View
      style={{
        alignSelf: 'center',
        bottom: 100,
        display: 'flex',
        position: 'absolute',
      }}
    >
      <Animated.View
        style={[{ width: 200, height: 200, backgroundColor: 'red' }, styles]}
        onTouchStart={handlePress}
      />
    </View>
  );
}
