import { AnimatedText, TextProps, useTextStyle } from '@/design-system';
import React, { useMemo, useCallback, useState } from 'react';
import { StyleProp, TextStyle, StyleSheet, ViewStyle, View, PixelRatio } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ExitAnimationsValues,
  runOnUI,
  LayoutAnimationsValues,
  useAnimatedRef,
  measure,
  interpolate,
  WithTimingConfig,
  SharedValue,
  useAnimatedReaction,
  runOnJS,
  DerivedValue,
  LayoutAnimationConfig,
  useDerivedValue,
  BaseAnimationBuilder,
  EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { EasingGradient } from '../easing-gradient/EasingGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { disableForTestingEnvironment } from '../animations/animationConfigs';
import { measureTextSync } from '@/utils/measureText';
import { useIsFirstRender } from '@/hooks/useIsFirstRender';
import { usePrevious } from '@/hooks';

// reanimated defines but does not export this type
type EntryOrExitLayoutType = BaseAnimationBuilder | typeof BaseAnimationBuilder | EntryExitAnimationFunction;

const DEFAULT_ANIMATION_DURATION = 550;
// credit to https://github.com/barvian/number-flow
const EASING_KEYFRAMES = [
  0, 0.005, 0.019, 0.039, 0.066, 0.096, 0.129, 0.165, 0.202, 0.24, 0.278, 0.316, 0.354, 0.39, 0.426, 0.461, 0.494, 0.526, 0.557, 0.586,
  0.614, 0.64, 0.665, 0.689, 0.711, 0.731, 0.751, 0.769, 0.786, 0.802, 0.817, 0.831, 0.844, 0.856, 0.867, 0.877, 0.887, 0.896, 0.904, 0.912,
  0.919, 0.925, 0.931, 0.937, 0.942, 0.947, 0.951, 0.955, 0.959, 0.962, 0.965, 0.968, 0.971, 0.973, 0.976, 0.978, 0.98, 0.981, 0.983, 0.984,
  0.986, 0.987, 0.988, 0.989, 0.99, 0.991, 0.992, 0.992, 0.993, 0.994, 0.994, 0.995, 0.995, 0.996, 0.996, 0.9963, 0.9967, 0.9969, 0.9972,
  0.9975, 0.9977, 0.9979, 0.9981, 0.9982, 0.9984, 0.9985, 0.9987, 0.9988, 0.9989, 1,
];

function customEasing(t: number) {
  'worklet';
  const n = EASING_KEYFRAMES.length;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const scaled = t * (n - 1);
  const i = Math.floor(scaled);
  const j = Math.min(i + 1, n - 1);
  const localT = scaled - i;
  return EASING_KEYFRAMES[i] + (EASING_KEYFRAMES[j] - EASING_KEYFRAMES[i]) * localT;
}

const DEFAULT_TIMING_CONFIG = disableForTestingEnvironment({ duration: DEFAULT_ANIMATION_DURATION, easing: customEasing });

type NumberPartType = 'integer' | 'separator' | 'prefix' | 'suffix';

type Part = {
  value: string;
  type: NumberPartType;
  key: string;
  index: number;
};

type TimingAnimationConfig = WithTimingConfig & {
  duration: number;
};

interface DigitProps {
  part: Part;
  timingConfig: TimingAnimationConfig;
  digitHeight: number;
  textStyle?: StyleProp<TextStyle>;
  numeralWidths: number[];
  isFirstRender: boolean;
  enteringAnimation: EntryOrExitLayoutType | undefined;
  exitingAnimation: EntryOrExitLayoutType | undefined;
  disabled: SharedValue<boolean>;
}

const numerals = Array.from({ length: 10 });

const Numerals = React.memo(function Numerals({ textStyle, digitHeight }: { textStyle: StyleProp<TextStyle>; digitHeight: number }) {
  const containerStyle = {
    height: digitHeight,
    justifyContent: 'center',
    alignItems: 'center',
  } as const;

  return (
    <>
      {numerals.map((_, i) => (
        <View key={i} style={containerStyle}>
          <Animated.Text style={textStyle}>{i}</Animated.Text>
        </View>
      ))}
    </>
  );
});

const Digit = function Digit({
  part,
  textStyle,
  timingConfig,
  digitHeight,
  numeralWidths,
  isFirstRender,
  enteringAnimation,
  exitingAnimation,
  disabled,
}: DigitProps) {
  const value = parseInt(part.value);
  const isDigitFirstRender = useIsFirstRender();
  const translateY = useSharedValue(0);
  const currentDigitWidth = useSharedValue(numeralWidths[value]);

  useAnimatedReaction(
    () => {
      return value;
    },
    currentValue => {
      const targetY = -currentValue * digitHeight;
      if (disabled.value) {
        translateY.value = targetY;
      } else {
        if (isDigitFirstRender && !isFirstRender) {
          translateY.value = 0;
          requestAnimationFrame(() => {
            translateY.value = withTiming(targetY, timingConfig);
          });
        } else if (isFirstRender) {
          translateY.value = targetY;
        } else {
          requestAnimationFrame(() => {
            translateY.value = withTiming(targetY, timingConfig);
          });
        }
      }

      /**
       * TODO: this breaks the container layout animation, seemingly because animating multiple children widths and a parent's translateX at the same time does not work.
       * In cases where we do not expect the number of digits to change often, this is acceptable.
       */
      const targetWidth = numeralWidths[value];
      if (isDigitFirstRender && !isFirstRender) {
        currentDigitWidth.value = targetWidth;
      } else if (targetWidth !== currentDigitWidth.value) {
        if (disabled.value) {
          currentDigitWidth.value = targetWidth;
        } else {
          requestAnimationFrame(() => {
            currentDigitWidth.value = withTiming(targetWidth, timingConfig);
          });
        }
      }
    },
    [disabled, isFirstRender, isDigitFirstRender, value, numeralWidths, timingConfig]
  );

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: currentDigitWidth.value,
    };
  });

  const numeralsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const containerStyle: ViewStyle = useMemo(() => {
    return {
      height: digitHeight,
      // this must be set to visible for the numbers to show on the exiting animation.
      overflow: 'visible',
    };
  }, [digitHeight]);

  return (
    <Animated.View
      pointerEvents="none"
      entering={enteringAnimation}
      exiting={exitingAnimation}
      style={[containerStyle, containerAnimatedStyle]}
    >
      <Animated.View style={numeralsAnimatedStyle}>
        <Numerals textStyle={textStyle} digitHeight={digitHeight} />
      </Animated.View>
    </Animated.View>
  );
};

interface NumberPartsProps {
  parts: Part[];
  textStyle: StyleProp<TextStyle>;
  timingConfig: TimingAnimationConfig;
  digitHeight: number;
  previousWidthDelta: SharedValue<number>;
  numeralWidths: number[];
  isFirstRender: boolean;
  characterEnteringAnimation: EntryOrExitLayoutType;
  disabled: SharedValue<boolean>;
  digitContainerStyle: ViewStyle;
}

const NumberParts = function NumberParts({
  parts,
  textStyle,
  timingConfig,
  digitHeight,
  previousWidthDelta,
  numeralWidths,
  isFirstRender,
  characterEnteringAnimation,
  disabled,
  digitContainerStyle,
}: NumberPartsProps) {
  const digitExitingAnimation = useCallback(
    ({ currentOriginX, currentOriginY }: ExitAnimationsValues) => {
      'worklet';
      const translateX = currentOriginX + previousWidthDelta.value;
      const targetOriginY = -9 * digitHeight;

      return {
        initialValues: {
          opacity: 1,
          originY: currentOriginY,
          originX: 0,
        },
        animations: {
          opacity: withTiming(0, timingConfig),
          originY: withTiming(targetOriginY, timingConfig),
          originX: translateX,
        },
      };
    },
    [timingConfig, digitHeight, previousWidthDelta]
  );
  const characterExitingAnimation = useCallback(
    ({ currentOriginX }: ExitAnimationsValues) => {
      'worklet';
      return {
        initialValues: {
          opacity: 1,
          originX: 0,
        },
        animations: {
          opacity: withTiming(0, timingConfig),
          originX: currentOriginX + previousWidthDelta.value,
        },
      };
    },
    [timingConfig, previousWidthDelta]
  );

  return parts.map(part => {
    if (part.type === 'integer') {
      return (
        <Digit
          key={part.key}
          part={part}
          textStyle={textStyle}
          timingConfig={timingConfig}
          digitHeight={digitHeight}
          numeralWidths={numeralWidths}
          isFirstRender={isFirstRender}
          enteringAnimation={characterEnteringAnimation}
          exitingAnimation={digitExitingAnimation}
          disabled={disabled}
        />
      );
    } else {
      return (
        <Animated.View key={part.key} style={digitContainerStyle} entering={characterEnteringAnimation} exiting={characterExitingAnimation}>
          <Animated.Text style={textStyle}>{part.value}</Animated.Text>
        </Animated.View>
      );
    }
  });
};

function getParts(value: string): Part[] {
  'worklet';
  const characters = value.split('');

  return characters.map((char, index) => {
    const isDigit = !isNaN(parseInt(char));
    const inverseIndex = characters.length - index - 1;

    if (!isDigit && index === 0) {
      return {
        value: char,
        key: `prefix-${char}`,
        type: 'prefix',
        index,
      };
    } else if (!isDigit && index === characters.length - 1) {
      return {
        value: char,
        key: `suffix-${char}`,
        type: 'suffix',
        index,
      };
    } else if (char === '.' || char === ',') {
      return {
        value: char,
        key: `${char}-${inverseIndex}`,
        type: 'separator',
        index,
      };
    } else if (isDigit) {
      return {
        value: char,
        key: `digit-${inverseIndex}`,
        type: 'integer',
        index,
      };
    } else {
      return {
        value: char,
        key: `other-${inverseIndex}`,
        type: 'separator',
        index,
      };
    }
  });
}

function getPartsByType(value: string) {
  'worklet';
  const allParts = getParts(value);
  return {
    prefix: allParts.filter(part => part.type === 'prefix'),
    number: allParts.filter(part => part.type !== 'prefix' && part.type !== 'suffix'),
    suffix: allParts.filter(part => part.type === 'suffix'),
    all: allParts,
    value,
  };
}

const emptyLayoutTransition = {
  initialValues: {},
  animations: {},
};

type AnimatedNumberProps = Omit<TextProps, 'children'> & {
  value: string | SharedValue<string> | DerivedValue<string>;
  timingConfig?: TimingAnimationConfig;
  easingMaskColor?: string;
  disabled?: SharedValue<boolean> | boolean;
};

export const AnimatedNumber = React.memo(function AnimatedNumber({
  value,
  timingConfig = DEFAULT_TIMING_CONFIG,
  easingMaskColor = 'white',
  disabled: disabledProp = false,
  style,
  ...textProps
}: AnimatedNumberProps) {
  const numberContainerRef = useAnimatedRef<Animated.View>();
  // holds the width of each numeral 0-9 for the current text style
  const isFirstRender = useIsFirstRender();

  const maskWidth = useSharedValue(0);
  const maskTranslateX = useSharedValue(0);
  const prefixTranslateX = useSharedValue(0);
  const suffixTranslateX = useSharedValue(0);
  const numberContainerGlobalOriginX = useSharedValue(0);
  const previousWidthDelta = useSharedValue(0);
  const numberContainerTranslateX = useSharedValue(0);
  const layoutTransitionProgress = useSharedValue(1);

  const disabled = useDerivedValue(() => {
    if (typeof disabledProp === 'boolean') {
      return disabledProp;
    }
    return disabledProp?.value ?? false;
  });

  // This is not ideal, but required to accommodate the use of a shared value for the value prop
  const [parts, setParts] = useState(() => (typeof value === 'string' ? getPartsByType(value) : getPartsByType(value.value)));
  const previousParts = usePrevious(parts);

  useAnimatedReaction(
    () => {
      return {
        value: typeof value === 'string' ? value : value.value,
        disabled: disabled.value,
      };
    },
    (current, previous) => {
      const wasJustDisabled = !previous?.disabled && current.disabled;
      if (!current.disabled || wasJustDisabled) {
        runOnJS(setParts)(getPartsByType(current.value));
      }
    },
    [value, disabled]
  );

  const baseTextStyle = useTextStyle(textProps);
  // TODO: should be configurable
  const digitHeight = useMemo(() => {
    const lineHeight = baseTextStyle.lineHeight ?? baseTextStyle.fontSize;
    return lineHeight * 1.1;
  }, [baseTextStyle]);

  const textStyle = useMemo(() => {
    return [
      {
        ...baseTextStyle,
        lineHeight: digitHeight,
      },
      style ?? {},
    ];
  }, [baseTextStyle, style, digitHeight]);

  const digitContainerStyle = useMemo(() => {
    return {
      height: digitHeight,
      justifyContent: 'center',
      alignItems: 'center',
    } as const;
  }, [digitHeight]);

  const layoutTransition = useCallback(
    (values: LayoutAnimationsValues) => {
      'worklet';

      const partsCountChanged = previousParts?.all.length !== parts.all.length;
      /* It's possible that the disabled state is not updated in time for the layout transition to be skipped.
      This is a workaround to skip the layout transition when disabled.
      */
      if (disabled.value || !partsCountChanged) {
        numberContainerGlobalOriginX.value = values.targetGlobalOriginX;
        previousWidthDelta.value = values.currentWidth - values.targetWidth;
        maskWidth.value = values.targetWidth;
        return emptyLayoutTransition;
      }

      const currentWidth = values.currentWidth;
      const targetWidth = values.targetWidth;
      const currentGlobalOriginX = numberContainerGlobalOriginX.value;
      const targetGlobalOriginX = values.targetGlobalOriginX;
      // there is a bug in renimated for the currentGlobalOriginX value, it is always be equal to the targetGlobalOriginX
      const widthDelta = currentWidth - targetWidth;
      const originXDelta = currentGlobalOriginX - targetGlobalOriginX;
      const newTranslateX = originXDelta + widthDelta;

      const newSuffixTranslateX = newTranslateX;
      let newPrefixTranslateX = -newTranslateX;
      let newMaskTranslateX = -newTranslateX * 2;

      const anchor = baseTextStyle.textAlign ?? 'center';

      if (anchor === 'right') {
        newPrefixTranslateX = -widthDelta;
        newMaskTranslateX = -widthDelta;
      } else if (anchor === 'left') {
        newPrefixTranslateX = 0;
        newMaskTranslateX = -widthDelta;
      }

      // Set offset values so that number appears to grow and shift from previous value
      prefixTranslateX.value = newPrefixTranslateX;
      suffixTranslateX.value = newSuffixTranslateX;
      maskTranslateX.value = newMaskTranslateX;
      maskWidth.value = values.currentWidth;
      numberContainerTranslateX.value = newTranslateX;
      layoutTransitionProgress.value = 0;

      // Animate the number to its new position
      suffixTranslateX.value = withTiming(0, timingConfig);
      prefixTranslateX.value = withTiming(0, timingConfig);
      numberContainerTranslateX.value = withTiming(0, timingConfig);
      // Animates mask to reveal new / hide removed digits
      maskWidth.value = withTiming(values.targetWidth, timingConfig);
      maskTranslateX.value = withTiming(0, timingConfig);
      layoutTransitionProgress.value = withTiming(1, timingConfig);

      numberContainerGlobalOriginX.value = values.targetGlobalOriginX;
      previousWidthDelta.value = widthDelta;

      return emptyLayoutTransition;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timingConfig, baseTextStyle, disabled, previousParts]
  );

  const characterEnteringAnimation = useCallback(() => {
    'worklet';
    if (disabled.value) {
      return emptyLayoutTransition;
    }
    return {
      initialValues: {
        opacity: 0,
      },
      animations: {
        // TODO: fix this
        opacity: withTiming(1, {
          ...timingConfig,
          // TODO: make this configurable
          duration: timingConfig.duration * 0.8,
        }),
      },
    };
  }, [timingConfig, disabled]);

  // const styles = useMemo(() => {
  //   return {
  //     maskElementAnimatedStyle: useAnimatedStyle(() => {
  //       if (maskWidth.value === 0) {
  //         return {
  //           width: undefined,
  //           transform: [{ translateX: 0 }],
  //         };
  //       }
  //       return {
  //         width: maskWidth.value,
  //         transform: [{ translateX: maskTranslateX.value }],
  //       };
  //     })
  //   };
  // }, [digitHeight, edgeGradientSizes.vertical]);

  const maskElementAnimatedStyle = useAnimatedStyle(() => {
    if (maskWidth.value === 0) {
      return {
        width: undefined,
        transform: [{ translateX: 0 }],
      };
    }
    return {
      width: maskWidth.value,
      transform: [{ translateX: maskTranslateX.value }],
    };
  });

  const horizontalEasingMaskAnimatedStyle = useAnimatedStyle(() => {
    if (disabled.value) {
      return { opacity: 0 };
    }
    return {
      opacity: interpolate(layoutTransitionProgress.value, [0, 0.05, 0.8, 1], [0, 1, 1, 0]),
    };
  });

  const onNumberContainerLayout = useCallback(() => {
    runOnUI(() => {
      if (numberContainerGlobalOriginX.value === 0) {
        const measurements = measure(numberContainerRef);
        if (!measurements) return;
        numberContainerGlobalOriginX.value = measurements.pageX;
      }
    })();
  }, [numberContainerGlobalOriginX, numberContainerRef]);

  const prefixPartAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: prefixTranslateX.value }],
    };
  });

  const suffixPartAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: suffixTranslateX.value }],
    };
  });

  const numeralWidths = useMemo(() => {
    if (textProps.tabularNumbers) {
      return [];
    }
    return new Array(10)
      .fill(0)
      .map((_, i) =>
        measureTextSync(i.toString(), {
          fontSize: baseTextStyle.fontSize,
          fontFamily: baseTextStyle.fontFamily,
          fontWeight: baseTextStyle.fontWeight,
          letterSpacing: baseTextStyle.letterSpacing,
          fontVariant: baseTextStyle.fontVariant,
        })
      )
      .filter(width => width !== undefined);
  }, [baseTextStyle, textProps.tabularNumbers]);

  const maskElementStyle = {
    height: digitHeight,
    backgroundColor: 'red', // arbitrary color
  };

  const edgeGradientSizes = useMemo(() => {
    return {
      horizontal: baseTextStyle.fontSize * 0.2,
      vertical: baseTextStyle.fontSize * 0.2,
    };
  }, [baseTextStyle]);

  const staticContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: disabled.value ? 1 : 0,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: disabled.value ? 0 : 1,
    };
  });

  const numberContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: numberContainerTranslateX.value }],
    };
  });

  return (
    <LayoutAnimationConfig skipEntering skipExiting>
      <View style={[styles.row, { height: digitHeight, marginVertical: -edgeGradientSizes.vertical }]}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              height: digitHeight,
              justifyContent: 'center',
            },
            staticContainerStyle,
          ]}
        >
          <AnimatedText
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...textProps}
            style={textStyle}
          >
            {value}
          </AnimatedText>
        </Animated.View>
        <Animated.View style={[styles.row, animatedContainerStyle]}>
          {parts.prefix && (
            <Animated.View style={prefixPartAnimatedStyle}>
              <NumberParts
                parts={parts.prefix}
                textStyle={textStyle}
                timingConfig={timingConfig}
                digitHeight={digitHeight}
                previousWidthDelta={previousWidthDelta}
                numeralWidths={numeralWidths}
                isFirstRender={isFirstRender}
                characterEnteringAnimation={characterEnteringAnimation}
                disabled={disabled}
                digitContainerStyle={digitContainerStyle}
              />
            </Animated.View>
          )}
          <Animated.View style={numberContainerStyle} ref={numberContainerRef} layout={layoutTransition} onLayout={onNumberContainerLayout}>
            <MaskedView maskElement={<Animated.View style={[maskElementAnimatedStyle, maskElementStyle]} />}>
              <View style={styles.row}>
                <NumberParts
                  parts={parts.number}
                  textStyle={textStyle}
                  timingConfig={timingConfig}
                  digitHeight={digitHeight}
                  previousWidthDelta={previousWidthDelta}
                  numeralWidths={numeralWidths}
                  isFirstRender={isFirstRender}
                  characterEnteringAnimation={characterEnteringAnimation}
                  disabled={disabled}
                  digitContainerStyle={digitContainerStyle}
                />
              </View>
            </MaskedView>
            <AnimatedEdgeGradients
              maskElementAnimatedStyle={maskElementAnimatedStyle}
              horizontalEasingMaskAnimatedStyle={horizontalEasingMaskAnimatedStyle}
              edgeSizes={edgeGradientSizes}
              color={easingMaskColor}
            />
          </Animated.View>
          {parts.suffix && (
            <Animated.View style={[suffixPartAnimatedStyle, { height: digitHeight }]}>
              <NumberParts
                parts={parts.suffix}
                textStyle={textStyle}
                timingConfig={timingConfig}
                digitHeight={digitHeight}
                previousWidthDelta={previousWidthDelta}
                numeralWidths={numeralWidths}
                isFirstRender={isFirstRender}
                characterEnteringAnimation={characterEnteringAnimation}
                disabled={disabled}
                digitContainerStyle={digitContainerStyle}
              />
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </LayoutAnimationConfig>
  );
});

const AnimatedEdgeGradients = React.memo(function AnimatedEdgeGradients({
  maskElementAnimatedStyle,
  horizontalEasingMaskAnimatedStyle,
  edgeSizes,
  color,
}: {
  maskElementAnimatedStyle: StyleProp<ViewStyle>;
  horizontalEasingMaskAnimatedStyle: StyleProp<ViewStyle>;
  edgeSizes: {
    horizontal: number;
    vertical: number;
  };
  color: string;
}) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, maskElementAnimatedStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, horizontalEasingMaskAnimatedStyle]}>
        <EasingGradient
          startPosition="left"
          endPosition="right"
          startColor={color}
          endColor={color}
          startOpacity={1}
          endOpacity={0}
          style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: edgeSizes.horizontal }}
        />
      </Animated.View>
      <EasingGradient
        startPosition="top"
        endPosition="bottom"
        startColor={color}
        endColor={color}
        startOpacity={1}
        endOpacity={0}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: edgeSizes.vertical }}
      />
      <EasingGradient
        startPosition="bottom"
        endPosition="top"
        startColor={color}
        endColor={color}
        startOpacity={1}
        endOpacity={0}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: edgeSizes.vertical }}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
