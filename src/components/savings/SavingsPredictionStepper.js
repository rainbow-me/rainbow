import AnimatedNumber from '@rainbow-me/react-native-animated-number';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { calculateEarningsInDays } from '../../helpers/savings';
import { colors, fonts, padding } from '../../styles';
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

const predictionFormatter = value => {
  const val = Number(value).toFixed(2);
  if (val === '0.00') {
    return '< $0.01';
  }

  return `$${val.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const SavingsPredictionStepper = ({ balance, interestRate }) => {
  const [step, setStep] = useState(1);
  const incrementStep = useCallback(
    p => (p + 1 === Object.keys(steps).length ? 0 : p + 1),
    []
  );

  const NUMBER = calculateEarningsInDays(
    balance,
    interestRate,
    Object.values(steps)[step].days
  );

  return (
    <ButtonPressAnimation
      duration={120}
      onPress={() => setStep(incrementStep)}
      scaleTo={1.04}
      width="100%"
    >
      <Row align="center" css={padding(15, 19, 19)}>
        <RowWithMargins align="center" margin={5}>
          <Emoji
            name="crystal_ball"
            size="medium"
            style={{ marginBottom: 0.5 }}
          />
          <Text size="lmedium">
            {`Est. ${Object.keys(steps)[step]} Earnings`}
          </Text>
        </RowWithMargins>
        <Row flex={1} justify="end">
          <AnimatedNumber
            disableTabularNums
            formatter={predictionFormatter}
            steps={9}
            style={sx.animatedNumber}
            time={8}
            value={NUMBER}
          />
        </Row>
      </Row>
    </ButtonPressAnimation>
  );
};

SavingsPredictionStepper.propTypes = {
  balance: PropTypes.string,
  interestRate: PropTypes.string,
};

export default React.memo(SavingsPredictionStepper);
