import { AnimatedText, TextProps, useTextStyle } from '@/design-system';
import React, { useMemo, useRef, useEffect, useCallback, MutableRefObject, useState } from 'react';
import { Animated as RNAnimated, StyleProp, TextStyle, StyleSheet, ViewStyle, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  ExitAnimationsValues,
  runOnUI,
  LayoutAnimationsValues,
  useAnimatedRef,
  measure,
  interpolate,
  WithTimingConfig,
  FadeOut,
  SharedValue,
  useAnimatedReaction,
  runOnJS,
  DerivedValue,
  LayoutAnimationConfig,
  useDerivedValue,
  BaseAnimationBuilder,
  EntryExitAnimationFunction,
  EntryAnimationsValues,
} from 'react-native-reanimated';
import { EasingGradient } from '../easing-gradient/EasingGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { disableForTestingEnvironment } from '../animations/animationConfigs';
import { measureText } from '@/utils';

// reanimated defines but does not export this type
type EntryOrExitLayoutType = BaseAnimationBuilder | typeof BaseAnimationBuilder | EntryExitAnimationFunction;

// TODO:
// - add trend prop to animate individual digit color red / green
// - add same exit animation translation fixing for separators
// - handle value changes in middle of animations
// - require and document why text alignment prop is required
// - fix 1 frame desync in parts layout update and disabled state

const DEFAULT_ANIMATION_DURATION = 600;
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
  // previousPart: Part | undefined;
  timingConfig: TimingAnimationConfig;
  digitHeight: number;
  previousWidthDelta: SharedValue<number>;
  textStyle?: StyleProp<TextStyle>;
  numeralWidthsRef: MutableRefObject<number[]>;
  isInitialRenderRef: MutableRefObject<boolean>;
  enteringAnimation: EntryOrExitLayoutType | undefined;
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
  previousWidthDelta,
  numeralWidthsRef,
  isInitialRenderRef,
  enteringAnimation,
  disabled,
}: DigitProps) {
  const value = parseInt(part.value);
  const isDigitInitialRenderRef = useRef(true);
  const translateY = useSharedValue(0);
  // const currentDigitWidth = useSharedValue(numeralWidthsRef.current[value]);

  // TODO: This seems to have better performance than useEffect/useLayoutEffect with runOnUI but I'm not sure why
  useAnimatedReaction(
    () => {
      return value;
    },
    currentValue => {
      const targetY = -currentValue * digitHeight;
      if (disabled.value) {
        translateY.value = targetY;
      } else {
        if (isDigitInitialRenderRef.current && !isInitialRenderRef.current) {
          translateY.value = 0;
          translateY.value = withTiming(targetY, timingConfig);
        } else {
          translateY.value = withTiming(targetY, timingConfig);
        }
      }
    },
    [disabled, value]
  );

  // TODO: This breaks the container layout transition

  // const targetWidth = numeralWidthsRef.current[value];
  // if (isDigitInitialRenderRef.current && !isInitialRenderRef.current) {
  //   runOnUI(() => {
  //     currentDigitWidth.value = targetWidth;
  //   })();
  //   isDigitInitialRenderRef.current = false;
  // } else if (targetWidth !== currentDigitWidth.value) {
  //   runOnUI(() => {
  //     if (isDisabled.value) {
  //       currentDigitWidth.value = targetWidth;
  //     } else {
  //       currentDigitWidth.value = withTiming(targetWidth, {
  //         ...timingConfig,
  //         duration: timingConfig.duration * 0.5,
  //       });
  //     }
  //   })();
  // }
  //   }

  const exitingAnimation = useCallback(
    (values: ExitAnimationsValues) => {
      'worklet';
      const translateX = values.currentOriginX + previousWidthDelta.value;
      // spin towards the further of 0 or 9
      // const targetOriginY = value < 5 ? -9 * digitHeight : 0;
      const targetOriginY = 0;

      const initialValues = {
        opacity: 1,
        originY: values.currentOriginY,
        originX: 0,
      };
      const animations = {
        opacity: withTiming(0, timingConfig),
        originY: withTiming(targetOriginY, timingConfig),
        originX: translateX,
      };
      return {
        initialValues,
        animations,
      };
    },
    [timingConfig]
  );

  const numeralsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  /**
   * TODO: this breaks the container layout transition completely, do not know why.
   * Even using a RNAnimated.View with the same width as the digitWidth does not work and breaks in the same way
   * This prevents us from having non tabular numbers
   */
  // const containerAnimatedStyle = useAnimatedStyle(() => {
  //   return {
  //     width: currentDigitWidth.value,
  //   };
  // });

  const containerStyle: ViewStyle = useMemo(() => {
    return {
      height: digitHeight,
      // this must be set to visible for the numbers to show on the exiting animation.
      overflow: 'visible',
    };
  }, [digitHeight]);

  return (
    <Animated.View pointerEvents="none" entering={enteringAnimation} exiting={exitingAnimation} style={containerStyle}>
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
  numeralWidthsRef: MutableRefObject<number[]>;
  isInitialRenderRef: MutableRefObject<boolean>;
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
  numeralWidthsRef,
  isInitialRenderRef,
  characterEnteringAnimation,
  disabled,
  digitContainerStyle,
}: NumberPartsProps) {
  return parts.map(part => {
    if (part.type === 'integer') {
      return (
        <Digit
          key={part.key}
          part={part}
          textStyle={textStyle}
          timingConfig={timingConfig}
          digitHeight={digitHeight}
          previousWidthDelta={previousWidthDelta}
          numeralWidthsRef={numeralWidthsRef}
          isInitialRenderRef={isInitialRenderRef}
          enteringAnimation={characterEnteringAnimation}
          disabled={disabled}
        />
      );
    } else {
      return (
        <Animated.View
          key={part.key}
          style={digitContainerStyle}
          entering={characterEnteringAnimation}
          // TODO: convert to custom to disable for disabled state
          exiting={FadeOut.duration(timingConfig.duration)}
        >
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
  const numeralWidthsRef = useRef<number[]>([]);
  const isInitialRenderRef = useRef(true);

  const maskWidth = useSharedValue(0);
  const maskTranslateX = useSharedValue(0);
  const prefixTranslateX = useSharedValue(0);
  const suffixTranslateX = useSharedValue(0);
  const numberContainerGlobalOriginX = useSharedValue(0);
  const transitionProgress = useSharedValue(0);
  const previousWidthDelta = useSharedValue(0);

  const disabled = useDerivedValue(() => {
    if (typeof disabledProp === 'boolean') {
      return disabledProp;
    }
    return disabledProp?.value ?? false;
  });

  // This is not ideal, but required to accommodate the use of a shared value for the value prop
  const [parts, setParts] = useState(() => (typeof value === 'string' ? getPartsByType(value) : getPartsByType(value.value)));

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
      /* It's possible that the disabled state is not updated in time for the layout transition to be skipped.
      This is a workaround to skip the layout transition when disabled.
      */
      if (disabled.value) {
        numberContainerGlobalOriginX.value = values.targetGlobalOriginX;
        previousWidthDelta.value = values.currentWidth - values.targetWidth;
        maskWidth.value = values.targetWidth;
        return {
          initialValues: {},
          animations: {},
        };
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

      // Animate the number to its new position
      suffixTranslateX.value = withTiming(0, timingConfig);
      prefixTranslateX.value = withTiming(0, timingConfig);
      // Animates mask to reveal new / hide removed digits
      maskWidth.value = withTiming(values.targetWidth, timingConfig);
      maskTranslateX.value = withTiming(0, timingConfig);

      transitionProgress.value = withTiming(1, timingConfig, () => {
        transitionProgress.value = 0;
      });

      numberContainerGlobalOriginX.value = values.targetGlobalOriginX;
      previousWidthDelta.value = widthDelta;

      return {
        initialValues: {
          transform: [{ translateX: newTranslateX }],
        },
        animations: {
          transform: [{ translateX: withTiming(0, timingConfig) }],
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timingConfig, baseTextStyle, disabled]
  );

  const characterEnteringAnimation = useCallback(() => {
    'worklet';
    if (disabled.value) {
      return {
        initialValues: {},
        animations: {},
      };
    }
    return {
      initialValues: {
        opacity: 0,
      },
      animations: {
        opacity: withTiming(1, {
          ...timingConfig,
          // TODO: make this configurable
          duration: timingConfig.duration * 0.8,
        }),
      },
    };
  }, [timingConfig, disabled]);

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
      opacity: interpolate(transitionProgress.value, [0, 0.05, 0.8, 1], [0, 1, 1, 0]),
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

  useEffect(() => {
    async function setNumeralWidths() {
      const widths = await Promise.all(
        new Array(10).fill(0).map((_, i) => measureText(i.toString(), textStyle).then(result => result.width))
      );
      const filteredWidths = widths.filter(width => width !== undefined);
      if (filteredWidths.length !== 10) {
        // TODO: handle fallback
        return;
      }
      numeralWidthsRef.current = filteredWidths;
    }
    // If tabular numbers are not enabled, we need to measure the widths of the numerals
    if (!textProps.tabularNumbers) {
      setNumeralWidths();
    }

    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
    }
  }, [textStyle, textProps.tabularNumbers]);

  const maskElementStyle = {
    height: digitHeight,
    // arbitrary color
    backgroundColor: 'red',
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
          <AnimatedText {...textProps} style={textStyle}>
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
                numeralWidthsRef={numeralWidthsRef}
                isInitialRenderRef={isInitialRenderRef}
                characterEnteringAnimation={characterEnteringAnimation}
                disabled={disabled}
                digitContainerStyle={digitContainerStyle}
              />
            </Animated.View>
          )}
          <Animated.View ref={numberContainerRef} layout={layoutTransition} onLayout={onNumberContainerLayout}>
            <MaskedView maskElement={<Animated.View style={[maskElementAnimatedStyle, maskElementStyle]} />}>
              <View style={styles.row}>
                <NumberParts
                  parts={parts.number}
                  textStyle={textStyle}
                  timingConfig={timingConfig}
                  digitHeight={digitHeight}
                  previousWidthDelta={previousWidthDelta}
                  numeralWidthsRef={numeralWidthsRef}
                  isInitialRenderRef={isInitialRenderRef}
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
                numeralWidthsRef={numeralWidthsRef}
                isInitialRenderRef={isInitialRenderRef}
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
