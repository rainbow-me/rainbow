import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

const steps = ['Monthly', 'Yearly', '5-Year', '10-Year', '20-Year', '50-Year'];

const SavingsPredictionStepper = ({ balance, interestRate }) => {
  const [step, setStep] = useState(0);
  const incrementStep = useCallback(() => {
    setStep(p => (p + 1 === steps.length ? 0 : p + 1));
  }, [setStep]);

  return (
    <ButtonPressAnimation onPress={incrementStep}>
      <Row align="center" css={padding(15, 19)}>
        <RowWithMargins align="center" margin={6}>
          <Emoji
            letterSpacing="tight"
            lineHeight="looser"
            name="crystal_ball"
            size="lmedium"
          />
          <Text letterSpacing="tight" size="lmedium">
            {`Est. ${steps[step]} Earnings`}
          </Text>
        </RowWithMargins>
        <Row flex={1} justify="end">
          <Text
            color={colors.dodgerBlue}
            weight="semibold"
            flexGrow={1}
            size="lmedium"
          >
            $3.96
          </Text>
        </Row>
      </Row>
    </ButtonPressAnimation>
  );
};

SavingsPredictionStepper.propTypes = {
  balance: PropTypes.number,
  interestRate: PropTypes.number,
};

export default SavingsPredictionStepper;
