import React, { memo, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/design-system';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface ShimmerTextProps {
  children: string;
  color: string;
  size?: '13pt' | '15pt';
  weight?: 'bold' | 'semibold' | 'medium' | 'regular';
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export const ShimmerText = memo(function ShimmerText({
  children,
  color,
  size = '15pt',
  weight = 'bold',
  numberOfLines = 1,
  ellipsizeMode = 'tail',
}: ShimmerTextProps) {
  const translateX = useSharedValue(-150);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(containerWidth + 150, {
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [translateX, containerWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View 
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <Text
            color={{ custom: color }}
            size={size}
            weight={weight}
            numberOfLines={numberOfLines}
            ellipsizeMode={ellipsizeMode}
          >
            {children}
          </Text>
        }
      >
        {/* Base text layer */}
        <Text
          color={{ custom: color }}
          size={size}
          weight={weight}
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
        >
          {children}
        </Text>
        
        {/* Shimmer overlay */}
        <AnimatedLinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0)',
            'rgba(128, 128, 128, 0.5)',
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFillObject, animatedStyle, { width: 150 }]}
        />
      </MaskedView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  maskedView: {
    flexDirection: 'row',
  },
});