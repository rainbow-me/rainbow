import lang from 'i18n-js';
import { constant, times } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { mixColor, useTimingTransition } from 'react-native-redash/src/v1';
import { useMemoOne } from 'use-memo-one';
import { FloatingEmojisTapper } from '../../floating-emojis';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { useBooleanState, usePrevious, useStepper } from '@rainbow-me/hooks';

const AnimatedSwapDetailsValue = Animated.createAnimatedComponent(
  SwapDetailsValue
);

const animationColorsFactory = colors => [
  colors.alpha(colors.blueGreyDark, 0.8),
  colors.uniswapPink,
];
const labels = [...times(8, constant('Uniswap ')), 'that unicorn one'];
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
  const { colors } = useTheme();
  const animationColors = useMemo(() => animationColorsFactory(colors), [
    colors,
  ]);
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
    label: labels[step],
    startAnimation,
  };
}

export default function SwapDetailsUniswapRow(props) {
  const { protocols } = props;
  const { color, label, startAnimation } = useUniswapLabelEasterEgg();

  if (
    protocols?.length &&
    protocols[0]?.name === 'UNISWAP_v2' &&
    protocols[0]?.part === '100'
  ) {
    return (
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
        <SwapDetailsRow label="Swapping via">
          <AnimatedSwapDetailsValue color={color}>
            {label}
          </AnimatedSwapDetailsValue>
        </SwapDetailsRow>
      </FloatingEmojisTapper>
    );
  } else if (protocols?.length > 1) {
    return (
      <SwapDetailsRow label="Swapping via:" truncated={false}>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{`\n\n`}
        {protocols.map(({ name, part }) => (
          <SwapDetailsValue color={color} key={`${name}_${part}`}>
            {name.replace('_', ' ')} {Number(part).toFixed(2)}% {`\n`}
          </SwapDetailsValue>
        ))}
      </SwapDetailsRow>
    );
  } else if (protocols?.length > 0) {
    return (
      <SwapDetailsRow label={lang.t('expanded_state.swap.swapping_via')}>
        <SwapDetailsValue color={color}>
          {protocols[0].name.replace('_', ' ')}
        </SwapDetailsValue>
      </SwapDetailsRow>
    );
  }
  return null;
}
