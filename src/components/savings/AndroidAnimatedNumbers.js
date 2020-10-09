import React, { useEffect, useMemo } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  NewEasing,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
import { isSymbolStablecoin } from '../../helpers/savings';
import { colors, fonts } from '@rainbow-me/styles';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const TextChunk = styled(AnimatedTextInput).attrs({
  editable: false,
})`
  color: ${colors.dark};
  font-family: ${fonts.family.SFProRounded};
  font-size: ${parseFloat(fonts.size.lmedium)};
  font-weight: ${fonts.weight.bold};
  text-align: left;
  width: 60;
`;

const Wrapper = styled(Animated.View).attrs({
  pointerEvents: 'none',
})`
  height: 38;
  overflow: hidden;
`;

const Row = styled.View`
  flex-direction: row;
  height: 35;
  left: 45;
  position: absolute;
`;

function formatSavingsAmount(val) {
  'worklet';
  return val.toFixed(10);
}

function TextChunkWrapper({ val, sub: { value, index }, i, a, isStable }) {
  const props = useAnimatedProps(() =>
    index === undefined
      ? {}
      : {
          text: val.value[index],
        }
  );

  const wrapperProps = useAnimatedProps(() => ({
    width:
      index !== undefined && val.value[index] === '.'
        ? 5.8
        : i === a.length - 1 && !isStable
        ? 50
        : 10,
  }));

  return (
    <Wrapper style={wrapperProps}>
      <TextChunk
        defaultValue={value}
        style={[
          {
            left: i === a.length - 1 && !isStable ? 0 : -3,
          },
          props,
        ]}
      />
    </Wrapper>
  );
}

function animationOneMinuteRec(svalue, target) {
  'worklet';
  svalue.value = withTiming(
    target * 60,
    { duration: 1000 * 60, easing: NewEasing.linear },
    () => {
      animationOneMinuteRec(svalue, target + 1);
    }
  );
}

export default function AndroidText({ animationConfig }) {
  const stepPerSecond = Math.max(0, animationConfig.stepPerDay / 24 / 60 / 60);
  const isStable = isSymbolStablecoin(animationConfig.symbol);
  const rawValue = useMemo(
    () =>
      (isStable ? [{ value: '$' }] : []).concat(
        formatSavingsAmount(animationConfig.initialValue)
          .split('')
          .map((value, index) => ({
            index,
            value,
          }))
          .concat(isStable ? [] : { value: animationConfig.symbol })
      ),
    [animationConfig, isStable]
  );
  const svalue = useSharedValue(0);
  useEffect(() => {
    animationOneMinuteRec(svalue, 1);
  }, [svalue]);

  const val = useDerivedValue(() =>
    formatSavingsAmount(
      svalue.value * stepPerSecond + animationConfig.initialValue,
      animationConfig.symbol
    )
  );

  return (
    <Row>
      {rawValue.map((v, i, a) => (
        <TextChunkWrapper
          a={a}
          i={i}
          isStable={isStable}
          key={`savings-${i}`}
          sub={v}
          val={val}
        />
      ))}
    </Row>
  );
}
