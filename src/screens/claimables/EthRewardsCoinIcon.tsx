import EthIcon from '@/assets/eth-icon.png';
import { Border, Box, useColorMode } from '@/design-system';
import { IS_TEST } from '@/env';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import FastImage, { type Source } from 'react-native-fast-image';
import Animated, { runOnUI, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export const EthRewardsCoinIcon = memo(function EthRewardsCoinIcon({
  animatedBorder,
  borderWidth = THICK_BORDER_WIDTH,
  showBorder = true,
  size = 44,
  style,
}: {
  animatedBorder?: boolean;
  borderWidth?: number;
  showBorder?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDarkMode } = useColorMode();

  const rotation = useSharedValue(0);

  const rotatingBorder = useAnimatedStyle(() => {
    return {
      transform: animatedBorder ? [{ rotate: `${rotation.value}deg` }] : undefined,
    };
  });

  useEffect(() => {
    if (animatedBorder && !IS_TEST) {
      runOnUI(() => {
        const currentRotation = rotation.value;
        rotation.value = currentRotation;
        rotation.value = withRepeat(withTiming(180, { duration: 6000 }), -1, true);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box style={[{ height: size, overflow: 'hidden', width: size }, style]}>
      <FastImage source={EthIcon as Source} style={{ height: size, width: size }} />
      {showBorder && isDarkMode && (
        <Animated.View style={[animatedBorder ? rotatingBorder : {}, { height: size, position: 'absolute', width: size }]}>
          <MaskedView
            maskElement={<Border borderColor="label" borderRadius={size / 2} borderWidth={borderWidth} />}
            style={{ height: size, position: 'absolute', width: size }}
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.12)',
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0)',
              ]}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.09, 0.41, 0.78, 1]}
              start={{ x: 0, y: 0.5 }}
              style={{ height: size, position: 'absolute', width: size }}
            />
          </MaskedView>
        </Animated.View>
      )}
    </Box>
  );
});
