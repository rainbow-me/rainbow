import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { colors, fonts, padding, position } from '../../styles';
import { AnimatedNumber, ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

/* eslint-disable sort-keys */
const steps = {
  Monthly: {
    number: '3.96',
    multiplier: 1,
  },
  Yearly: {
    number: '47.48',
    multiplier: 1,
  },
  '5-Year': {
    number: '331.28',
    multiplier: 1,
  },
  '10-Year': {
    number: '923.50',
    multiplier: 1,
  },
  '20-Year': {
    number: '3874.76',
    multiplier: 1,
  },
  '50-Year': {
    number: '140187.19',
    multiplier: 1,
  },
};
/* eslint-enable sort-keys */

const predictionFormatter = value =>
  `$${Number(value)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const SavingsPredictionStepper = ({ balance, interestRate }) => {
  const [step, setStep] = useState(0);
  const incrementStep = useCallback(
    p => (p + 1 === Object.keys(steps).length ? 0 : p + 1),
    []
  );

  const NUMBER = Number(Object.values(steps)[step].number);
  console.log('NUMBER', NUMBER);

  return (
    <ButtonPressAnimation
      duration={120}
      onPress={() => setStep(incrementStep)}
      scaleTo={1.05}
      width="100%"
    >
      <Row align="center" css={padding(15, 19)}>
        <RowWithMargins align="center" margin={6}>
          <Emoji
            letterSpacing="tight"
            lineHeight="looser"
            name="crystal_ball"
            size="lmedium"
          />
          <Text letterSpacing="tight" size="lmedium">
            {`Est. ${Object.keys(steps)[step]} Earnings`}
          </Text>
        </RowWithMargins>
        <Row flex={1} justify="end">
          <AnimatedNumber
            disableTabularNums
            formatter={predictionFormatter}
            steps={9}
            style={{
              color: colors.dodgerBlue,
              flexGrow: 1,
              fontSize: parseFloat(fonts.size.lmedium),
              fontWeight: fonts.weight.semibold,
            }}
            time={8}
            value={NUMBER}
          />
        </Row>
      </Row>
    </ButtonPressAnimation>
  );
};

SavingsPredictionStepper.propTypes = {
  balance: PropTypes.number,
  interestRate: PropTypes.number,
};

export default React.memo(SavingsPredictionStepper);
