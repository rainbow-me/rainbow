import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { requireNativeComponent, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import isRainbowTextAvailable from '../../helpers/isRainbowTextAvailable';
import { formatSavingsAmount, isSymbolStablecoin } from '../../helpers/savings';
import AndroidText from './AndroidAnimatedNumbers';
import { fonts } from '@rainbow-me/styles';

const sx = StyleSheet.create({
  animatedNumber: {
    height: 30,
  },
  animatedNumberAndroid: {
    left: 35,
    position: 'absolute',
    top: 4,
  },
  text: {
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
    val => `${formatSavingsAmount(val)} ${symbol} `,
    [symbol]
  );

  const { isDarkMode: darkMode, colors } = useTheme();

  const TextComponent = isRainbowTextAvailable
    ? requireNativeComponent('RainbowText')
    : AndroidText;

  return (
    <TextComponent
      animationConfig={{
        color: colors.green, // HEX
        darkMode,
        decimals: 10,
        duration: 800, // in intervals
        initialValue: Number(initialValue),
        interval,
        isSymbolStablecoin: isSymbolStablecoin(symbol),
        stepPerDay: Number(value) - Number(initialValue),
        symbol,
      }}
      colors={colors}
      formatter={formatter}
      initialValue={Number(initialValue)}
      steps={steps}
      style={[
        sx.text,
        { color: colors.dark },
        isRainbowTextAvailable ? sx.animatedNumber : null,
        android ? sx.animatedNumberAndroid : null,
      ]}
      time={interval}
      value={Number(value)}
    >
      {isRainbowTextAvailable ? null : formatter(initialValue)}
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
