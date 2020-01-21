import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState } from 'react';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis, FloatingEmojisTapHandler } from '../floating-emojis';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

/* eslint-disable sort-keys */
const steps = {
  Monthly: {
    emoji: 'crystal_ball',
    multiplier: 1,
  },
  Yearly: {
    emoji: 'soon',
    multiplier: 1,
  },
  '5-Year': {
    emoji: 'speak_no_evil',
    multiplier: 1,
  },
  '10-Year': {
    emoji: 'star-struck',
    multiplier: 1,
  },
  '20-Year': {
    emoji: 'money_with_wings',
    multiplier: 1,
  },
  '50-Year': {
    emoji: 'older_adult',
    multiplier: 1,
  },
};
/* eslint-enable sort-keys */

const SavingsPredictionStepper = ({ balance, interestRate }) => {
  const [step, setStep] = useState(0);
  const incrementStep = useCallback(() => {
    setStep(p => (p + 1 === Object.keys(steps).length ? 0 : p + 1));
  }, [setStep]);

  return (
    <FloatingEmojis
      distance={350}
      duration={2000}
      emoji={Object.values(steps)[step].emoji}
      size={36}
      wiggleFactor={1}
    >
      {({ onNewEmoji }) => (
        <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
          <ButtonPressAnimation
            duration={100}
            onPressStart={incrementStep}
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
                <Text
                  color={colors.dodgerBlue}
                  flexGrow={1}
                  size="lmedium"
                  weight="semibold"
                >
                  $3.96
                </Text>
              </Row>
            </Row>
          </ButtonPressAnimation>
        </FloatingEmojisTapHandler>
      )}
    </FloatingEmojis>
  );
};

SavingsPredictionStepper.propTypes = {
  balance: PropTypes.number,
  interestRate: PropTypes.number,
};

export default React.memo(SavingsPredictionStepper);
