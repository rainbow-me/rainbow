import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleSheet,
  Text,
} from 'react-native';
import useRainbowTextAvailable from '../../helpers/isRainbowTextAvailable';
import { formatSavingsAmount, isSymbolStablecoin } from '../../helpers/savings';
import { colors, fonts } from '@rainbow-me/styles';

const sx = StyleSheet.create({
  animatedNumber: {
    height: 30,
  },
  animatedNumberAndroid: {
    paddingLeft: 35,
    position: 'absolute',
    top: 12,
  },
  text: {
    color: colors.dark,
    flex: 1,
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.lmedium),
    fontWeight: fonts.weight.bold,
    letterSpacing: fonts.letterSpacing.roundedTightest,
    marginBottom: 0.5,
    marginLeft: 6,
    marginRight: 4,
    textAlign: 'left',
  },
});

const SavingsListRowAnimatedNumber = ({
  initialValue,
  interval,
  steps,
  symbol,
  value,
}) => {
  const formatter = useCallback(
    val =>
      isSymbolStablecoin(symbol)
        ? `$${formatSavingsAmount(val)}`
        : `${formatSavingsAmount(val)} ${symbol}`,
    [symbol]
  );

  const isRainbowTextAvailable = useRainbowTextAvailable();
  const TextComponent = isRainbowTextAvailable
    ? requireNativeComponent('RainbowText')
    : Text;

  return (
    <TextComponent
      animationConfig={{
        color: '#2CCC00', // HEX
        decimals: 10,
        duration: 800, // in intervals
        initialValue: Number(initialValue),
        interval,
        isSymbolStablecoin: isSymbolStablecoin(symbol),
        stepPerDay: Number(value) - Number(initialValue),
        symbol,
      }}
      formatter={formatter}
      initialValue={Number(initialValue)}
      steps={steps}
      style={[
        sx.text,
        isRainbowTextAvailable ? sx.animatedNumber : null,
        Platform.OS === 'android' ? sx.animatedNumberAndroid : null,
      ]}
      time={interval}
      value={Number(value)}
    >
      {isRainbowTextAvailable ? '' : formatter(initialValue)}
    </TextComponent>
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
