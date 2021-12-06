import { constant, times } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { mixColor, useTimingTransition } from 'react-native-redash/src/v1';
import { useMemoOne } from 'use-memo-one';
import { FloatingEmojisTapper } from '../../floating-emojis';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwapDetailsRow' was resolved to '/Users/... Remove this comment to see the full error message
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useBooleanState, usePrevious, useStepper } from '@rainbow-me/hooks';

const AnimatedSwapDetailsValue = Animated.createAnimatedComponent(
  SwapDetailsValue
);

const animationColorsFactory = (colors: any) => [
  colors.alpha(colors.blueGreyDark, 0.8),
  colors.uniswapPink,
];
const labels = [...times(8, constant('Uniswap v2')), 'that unicorn one'];
const emojis = [
  ...times(5, constant('unicorn')),
  'socks',
  ...times(2, constant('unicorn')),
  'rainbow',
];

function useUniswapLabelEasterEgg() {
  const [shouldAnimate, setShouldAnimate] = useBooleanState(false, 4000);
  const prevShouldAnimate = usePrevious(shouldAnimate);
  const [step, nextStep, setStep] = useStepper(labels.length);
  const val = useTimingTransition(shouldAnimate, { duration: 250 });
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const animationColors = useMemo(() => animationColorsFactory(colors), [
    colors,
  ]);
  // @ts-expect-error ts-migrate(2556) FIXME: Expected 3-4 arguments, but got 1 or more.
  const color = useMemoOne(() => mixColor(val, ...animationColors), [val]);
  const startAnimation = useCallback(() => {
    setShouldAnimate();
    nextStep();
  }, [nextStep, setShouldAnimate]);
  useEffect(() => {
    if (prevShouldAnimate && !shouldAnimate) {
      setStep(0);
    }
  }, [prevShouldAnimate, setStep, shouldAnimate]);
  return {
    color,
    label: `${labels[step]} 🦄`,
    startAnimation,
  };
}

export default function SwapDetailsUniswapRow(props: any) {
  const { color, label, startAnimation } = useUniswapLabelEasterEgg();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingEmojisTapper
      activeScale={1.06}
      disableRainbow
      distance={150}
      duration={1500}
      emojis={emojis}
      onPress={startAnimation}
      radiusAndroid={30}
      scaleTo={0}
      size={50}
      wiggleFactor={0}
      {...props}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwapDetailsRow label="Swapping via">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AnimatedSwapDetailsValue color={color}>
          {label}
        </AnimatedSwapDetailsValue>
      </SwapDetailsRow>
    </FloatingEmojisTapper>
  );
}
