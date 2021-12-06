import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { requireNativeComponent, StyleSheet } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import isRainbowTextAvailable from '../../helpers/isRainbowTextAvailable';
import { formatSavingsAmount, isSymbolStablecoin } from '../../helpers/savings';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AndroidAnimatedNumbers' was resolved to ... Remove this comment to see the full error message
import AndroidText from './AndroidAnimatedNumbers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
}: any) => {
  const formatter = useCallback(
    val => `${formatSavingsAmount(val)} ${symbol} `,
    [symbol]
  );

  const { isDarkMode: darkMode, colors } = useTheme();

  const TextComponent = isRainbowTextAvailable
    ? requireNativeComponent('RainbowText')
    : AndroidText;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
