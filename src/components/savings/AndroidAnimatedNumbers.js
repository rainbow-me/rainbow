import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
//import { STABLECOINS } from '../../helpers/savings';
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

// function isSymbolStablecoin(symbol) {
//   'worklet';
//   return STABLECOINS.indexOf(symbol) !== -1;
// }

function formatSavingsAmount(val) {
  'worklet';
  return val.toFixed(10);
}

// function formatter(val, symbol) {
//   'worklet';
//   return isSymbolStablecoin(symbol)
//     ? `$${formatSavingsAmount(val)}`
//     : `${formatSavingsAmount(val)} ${symbol}`;
// }

function TextChunkWrapper({ val, index, default: defaultValue, notAnimated }) {
  const props = useAnimatedProps(() =>
    notAnimated ? {} : { text: val.value[index] }
  );
  return <TextChunk defaultValue={defaultValue} style={props} />;
}

function animationOneMinuteRec(svalue, target) {
  'worklet';
  svalue.value = withTiming(100, { duration: 1000 * 60 }, () => {
    animationOneMinuteRec(svalue, target + 60);
  });
}

export default function AndroidText({ animationConfig }) {
  const stepPerSecond = animationConfig.stepPerDay / 24 / 60 / 60;
  const [rawValue] = useState(
    formatSavingsAmount(animationConfig.initialValue)
  );
  const svalue = useSharedValue(0);
  useEffect(() => {
    animationOneMinuteRec(60, svalue);
  }, [svalue]);

  const val = useDerivedValue(() =>
    formatSavingsAmount(
      svalue.value * stepPerSecond + animationConfig.initialValue,
      animationConfig.symbol
    )
  );

  const maybeCoin = false;
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
      {rawValue.split('').map((v, i, a) => (
        <View
          key={`savings-${i}`}
          style={{
            height: 38,
            overflow: 'hidden',
            width: i === a.length - 1 && maybeCoin ? 50 : v === '.' ? 6 : 9.5,
          }}
        >
          <View
            style={{
              left: i === a.length - 1 && maybeCoin ? 0 : -3,
              width: 60,
            }}
          >
            <TextChunkWrapper default={v} index={i} val={val} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
