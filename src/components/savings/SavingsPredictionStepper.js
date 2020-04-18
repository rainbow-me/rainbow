import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  calculateEarningsInDays,
  isSymbolStablecoin,
} from '../../helpers/savings';
import { handleSignificantDecimals } from '../../helpers/utilities';
import { colors, fonts, padding } from '../../styles';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

const sx = StyleSheet.create({
  animatedNumber: {
    color: colors.swapPurple,
    flexGrow: 1,
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.lmedium),
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedTight,
  },
  emoji: {
    marginBottom: 0.5,
  },
});

/* eslint-disable sort-keys */
const steps = {
  Monthly: {
    days: 30,
  },
  Yearly: {
    days: 365,
  },
  '5-Year': {
    days: 365 * 5,
  },
  '10-Year': {
    days: 365 * 10,
  },
  '20-Year': {
    days: 365 * 20,
  },
  '50-Year': {
    days: 365 * 50,
  },
  '100-Year': {
    days: 365 * 100,
  },
};
/* eslint-enable sort-keys */

function useStepper(max, initial = 0) {
  const [step, setStep] = useState(initial);
  const nextStep = useCallback(() => setStep(p => (p + 1) % max), [max]);
  return [step, nextStep];
}

const SavingsPredictionStepper = ({ asset, balance, interestRate }) => {
  const [step, nextStep] = useStepper(Object.keys(steps).length, 1);
  const { decimals, symbol } = asset;

  const estimatedEarnings = calculateEarningsInDays(
    balance,
    interestRate,
    Object.values(steps)[step].days
  );

  const formatter = useCallback(
    value => {
      const formattedValue = handleSignificantDecimals(value, decimals, 1);

      return isSymbolStablecoin(symbol)
        ? `$${formattedValue}`
        : `${formattedValue} ${symbol}`;
    },
    [decimals, symbol]
  );

  return (
    <ButtonPressAnimation
      duration={120}
      onPress={nextStep}
      scaleTo={1.04}
      width="100%"
    >
      <Row align="center" css={padding(15, 19, 19)}>
        <RowWithMargins align="center" margin={5}>
          <Emoji name="crystal_ball" size="medium" style={sx.emoji} />
          <Text size="lmedium">
            {`Est. ${Object.keys(steps)[step]} Earnings`}
          </Text>
        </RowWithMargins>
        <Row flex={1} justify="end">
          <AnimatedNumber
            disableTabularNums
            formatter={formatter}
            steps={9}
            style={sx.animatedNumber}
            time={8}
            value={estimatedEarnings}
          />
        </Row>
      </Row>
    </ButtonPressAnimation>
  );
};

SavingsPredictionStepper.propTypes = {
  asset: PropTypes.shape({
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }),
  balance: PropTypes.string,
  interestRate: PropTypes.string,
};

export default magicMemo(SavingsPredictionStepper, ['balance', 'interestRate']);
