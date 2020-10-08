import React, { useEffect, useMemo } from 'react';
import { TextInput, View } from 'react-native';
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
`;

function formatSavingsAmount(val) {
  'worklet';
  return val.toFixed(10);
}

function TextChunkWrapper({ val, sub: { value, index } }) {
  const props = useAnimatedProps(() =>
    index === undefined
      ? {}
      : {
          text: val.value[index],
        }
  );
  return <TextChunk defaultValue={value} style={props} />;
}

function animationOneMinuteRec(svalue, target) {
  'worklet';
  svalue.value = withTiming(
    target,
    { duration: 1000, easing: NewEasing.linear },
    () => {
      animationOneMinuteRec(svalue, target + 1);
    }
  );
}

export default function AndroidText({ animationConfig }) {
  const stepPerSecond = animationConfig.stepPerDay / 24 / 60 / 60;
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
    <Animated.View
      {...val}
      style={{
        flexDirection: 'row',
        height: 35,
        left: 45,
        position: 'absolute',
      }}
    >
      {rawValue.map((v, i, a) => (
        <View
          key={`savings-${i}`}
          pointerEvents="none"
          style={{
            height: 38,
            overflow: 'hidden',
            width:
              i === a.length - 1 && !isStable ? 50 : v.value === '.' ? 6 : 9.5,
          }}
        >
          <View
            style={{
              left: i === a.length - 1 && !isStable ? 0 : -3,
              width: 60,
            }}
          >
            <TextChunkWrapper sub={v} val={val} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
