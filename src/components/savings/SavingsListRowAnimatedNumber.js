import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  findNodeHandle,
  NativeModules,
  Platform,
  requireNativeComponent,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
} from 'react-native';
import { formatSavingsAmount, isSymbolStablecoin } from '../../helpers/savings';
import { colors, fonts } from '../../styles';

const RainbowText = requireNativeComponent('RainbowText');
const { RainbowText: RainbowTextManager } = NativeModules;
console.log(RainbowTextManager);

const sx = StyleSheet.create({
  animatedNumberAndroid: {
    height: 40,
    paddingLeft: 35,
    position: 'absolute',
  },
  text: {
    color: colors.dark,
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.lmedium),
    fontWeight: fonts.weight.bold,
    letterSpacing: fonts.letterSpacing.roundedTightest,
    marginBottom: 0.5,
    marginRight: 4,
    textAlign: 'left',
  },
});

const MS_IN_1_DAY = 1000 * 60 * 60 * 24;

const SavingsListRowAnimatedNumber = ({
  initialValue,
  interval,
  steps,
  symbol,
  value,
}) => {
  const ref = useRef();
  const formatter = useCallback(
    val =>
      isSymbolStablecoin(symbol)
        ? `$${formatSavingsAmount(val)}`
        : `${formatSavingsAmount(val)} ${symbol}`,
    [symbol]
  );

  //useEffect(() => ref.current.animate(), []);

  console.log((value - initialValue) / MS_IN_1_DAY);

  return (
    <RainbowText
      formatter={formatter}
      initialValue={Number(initialValue)}
      steps={steps}
      style={[
        sx.text,
        Platform.OS === 'android' ? sx.animatedNumberAndroid : null,
      ]}
      time={interval}
      value={Number(value)}
      text={formatter(Number(value))}
      animationConfig={{
        decimals: 10,
        initialValue: Number(value),
        interval: 60,
        isSymbolStablecoin: isSymbolStablecoin(symbol),
        stepPerDay: Number(value) - Number(initialValue),
        symbol,
      }}
    />
  );
};

SavingsListRowAnimatedNumber.propTypes = {
  initialValue: PropTypes.string,
  interval: PropTypes.number,
  steps: PropTypes.number,
  symbol: PropTypes.string,
  value: PropTypes.string,
};

export default React.memo(SavingsListRowAnimatedNumber);
