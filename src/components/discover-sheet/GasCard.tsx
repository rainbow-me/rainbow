// @ts-expect-error
import AnimateNumber from '@bankify/react-native-animate-number';
import { useIsFocused } from '@react-navigation/native';
import lang from 'i18n-js';
import { isNaN } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import {
  AccentColorProvider,
  Box,
  Heading,
  Inset,
  Stack,
  Text,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { add } from '@/helpers/utilities';
import { useDimensions, useGas } from '@/hooks';
import { useTheme } from '@/theme';
import { gasUtils } from '@/utils';

type AnimationConfigOptions = {
  duration: number;
  easing: Animated.EasingFunction;
};

const containerConfig = {
  damping: 15,
  mass: 1,
  stiffness: 200,
};
const pulseConfig = {
  damping: 66,
  mass: 1,
  stiffness: 333,
};
const fadeOutConfig: AnimationConfigOptions = {
  duration: 600,
  easing: Easing.bezierFn(0.76, 0, 0.24, 1),
};

export default function GasCard() {
  const { colorMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const {
    currentBlockParams,
    gasFeeParamsBySpeed,
    startPollingGasFees,
    stopPollingGasFees,
  } = useGas();
  const isFocused = useIsFocused();
  const [lastKnownGwei, setLastKnownGwei] = useState('');
  const { colors } = useTheme();

  const container = useSharedValue(1);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const cardShadow = useMemo(
    () => ({
      custom: {
        android: {
          elevation: 24,
          opacity: 0.5,
        },
        ios: [
          {
            blur: 24,
            offset: { x: 0, y: 8 },
            opacity: colorMode === 'dark' ? 0.3 : 0.1,
          },
          {
            blur: 6,
            offset: { x: 0, y: 2 },
            opacity: 0.02,
          },
        ],
      },
    }),
    [colorMode]
  );

  // Listen to gas prices
  useEffect(() => {
    if (isFocused) {
      startPollingGasFees();
    } else {
      stopPollingGasFees();
    }
  }, [isFocused, startPollingGasFees, stopPollingGasFees]);

  const { NORMAL } = gasUtils;

  const currentGwei = useMemo(
    () =>
      add(
        currentBlockParams?.baseFeePerGas?.gwei,
        gasFeeParamsBySpeed[NORMAL]?.maxPriorityFeePerGas?.gwei
      ),
    [NORMAL, currentBlockParams?.baseFeePerGas?.gwei, gasFeeParamsBySpeed]
  );
  const isCurrentGweiLoaded = currentGwei && Number(currentGwei) > 0;

  const renderGweiText = useCallback(
    animatedNumber => {
      const priceText =
        animatedNumber === 0
          ? isCurrentGweiLoaded
            ? Math.round(Number(currentGwei))
            : Math.round(Number(lastKnownGwei)) || '􀖇'
          : animatedNumber;
      return (
        <Heading color="accent" size="44px / 53px (Deprecated)" weight="bold">
          {priceText}
        </Heading>
      );
    },
    [currentGwei, isCurrentGweiLoaded, lastKnownGwei]
  );

  const formatGasPrice = useCallback(animatedValue => {
    if (animatedValue === null || isNaN(animatedValue)) {
      return 0;
    } else {
      return Math.round(animatedValue);
    }
  }, []);

  const handlePress = useCallback(() => {
    opacity.value = 0;
    scale.value = 0;
    container.value = withSequence(
      withSpring(1.1, containerConfig),
      withSpring(1, pulseConfig)
    );
    opacity.value = withSequence(
      withSpring(1, pulseConfig),
      withTiming(0, fadeOutConfig),
      withTiming(0, { duration: 0 })
    );
    scale.value = withSequence(
      withSpring(1, pulseConfig),
      withTiming(1, fadeOutConfig),
      withTiming(0, { duration: 0 })
    );
  }, [container, opacity, scale]);

  const cardColor = useForegroundColor({
    custom: {
      dark: '#22232A',
      light: '#FFFFFF',
    },
  });
  const grey = useForegroundColor('secondary60');
  const green = useForegroundColor({
    custom: {
      dark: colors.green,
      light: '#1DB847',
    },
  });
  const blue = useForegroundColor({
    custom: {
      dark: '#5FA9EE',
      light: '#3157D3',
    },
  });
  const orange = useForegroundColor({
    custom: {
      dark: '#FF983D',
      light: '#FF801F',
    },
  });
  const pink = useForegroundColor({
    custom: {
      dark: colors.pink,
      light: '#FF5CA0',
    },
  });

  const getColorForGwei = (currentGwei: string, lastKnownGwei: string) => {
    'worklet';
    const gwei =
      Math.round(Number(currentGwei)) || Math.round(Number(lastKnownGwei));

    if (!gwei) {
      return grey;
    } else if (gwei < 40) {
      return green;
    } else if (gwei < 100) {
      return blue;
    } else if (gwei < 200) {
      return orange;
    } else {
      return pink;
    }
  };

  const getCurrentPriceComparison = (
    currentGwei: string,
    lastKnownGwei: string
  ) => {
    const gwei =
      Math.round(Number(currentGwei)) || Math.round(Number(lastKnownGwei));

    if (!gwei) {
      return lang.t('discover.gas.loading');
    } else if (gwei < 30) {
      return lang.t('discover.gas.very_low');
    } else if (gwei < 40) {
      return lang.t('discover.gas.low');
    } else if (gwei < 100) {
      return lang.t('discover.gas.average');
    } else if (gwei < 200) {
      return lang.t('discover.gas.high');
    } else {
      return lang.t('discover.gas.surging');
    }
  };

  useEffect(() => {
    if (
      isCurrentGweiLoaded &&
      Math.round(Number(currentGwei)) !== Math.round(Number(lastKnownGwei))
    ) {
      setLastKnownGwei(currentGwei);
      opacity.value = 0;
      scale.value = 0;
      container.value = withSequence(
        withSpring(1.1, containerConfig),
        withSpring(1, pulseConfig)
      );
      opacity.value = withSequence(
        withSpring(1, pulseConfig),
        withTiming(0, fadeOutConfig),
        withTiming(0, { duration: 0 })
      );
      scale.value = withSequence(
        withSpring(1, pulseConfig),
        withTiming(1, fadeOutConfig),
        withTiming(0, { duration: 0 })
      );
    }
  }, [
    container,
    currentGwei,
    isCurrentGweiLoaded,
    lastKnownGwei,
    opacity,
    scale,
  ]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: 1 * container.value,
        },
      ],
    };
  }, [currentGwei, lastKnownGwei]);

  const pulseStyle = useAnimatedStyle(() => {
    const color = getColorForGwei(currentGwei, lastKnownGwei);

    return {
      backgroundColor: color,
      borderRadius: 24,
      height: '100%',
      opacity: 0.08 * opacity.value,
      transform: [
        {
          scale: 1 * scale.value,
        },
      ],
      width: '100%',
    };
  }, [currentGwei, lastKnownGwei]);

  return (
    <Animated.View style={containerStyle}>
      <ButtonPressAnimation
        onPress={handlePress}
        scaleTo={1}
        style={
          android && {
            paddingBottom: 19,
            paddingLeft: 19,
            paddingRight: 9.5,
          }
        }
        testID="gas-button"
      >
        <AccentColorProvider color={cardColor}>
          <Box
            background="accent"
            borderRadius={24}
            height={{ custom: (deviceWidth - 19 * 3) / 2 }}
            shadow={cardShadow}
          >
            <AccentColorProvider
              color={getColorForGwei(currentGwei, lastKnownGwei)}
            >
              <Box as={Animated.View} position="absolute" style={pulseStyle} />
              <Inset
                bottom={{ custom: 23.5 }}
                horizontal={{ custom: 20 }}
                top="24px"
              >
                <Box height="full">
                  <Stack>
                    <Stack space={{ custom: 14 }}>
                      <AnimateNumber
                        formatter={formatGasPrice}
                        interval={2}
                        renderContent={renderGweiText}
                        timing={(t: number) => 1 - --t * t * t * t}
                        value={currentGwei || lastKnownGwei}
                      />
                      <Text
                        color="accent"
                        size="18px / 27px (Deprecated)"
                        weight="bold"
                      >
                        {!isCurrentGweiLoaded && !lastKnownGwei
                          ? ''
                          : lang.t('discover.gas.gwei')}
                      </Text>
                    </Stack>
                  </Stack>
                  <Box bottom="0px" position="absolute">
                    <Stack space={{ custom: 11 }}>
                      <Text
                        color="secondary60"
                        size="14px / 19px (Deprecated)"
                        weight="bold"
                      >
                        {lang.t('discover.gas.network_fees')}
                      </Text>
                      <Text
                        color={
                          !isCurrentGweiLoaded && !lastKnownGwei
                            ? 'secondary60'
                            : 'secondary80'
                        }
                        size="18px / 27px (Deprecated)"
                        weight="bold"
                      >
                        {getCurrentPriceComparison(currentGwei, lastKnownGwei)}
                      </Text>
                    </Stack>
                  </Box>
                </Box>
              </Inset>
            </AccentColorProvider>
          </Box>
        </AccentColorProvider>
      </ButtonPressAnimation>
    </Animated.View>
  );
}
