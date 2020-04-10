import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { formatSavingsAmount, isSymbolStablecoin } from '../../helpers/savings';
import { colors, fonts } from '../../styles';

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

  return (
    <AnimatedNumber
      formatter={formatter}
      initialValue={Number(initialValue)}
      steps={steps}
      style={[
        sx.text,
        Platform.OS === 'android' ? sx.animatedNumberAndroid : null,
      ]}
      time={interval}
      value={Number(value)}
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
