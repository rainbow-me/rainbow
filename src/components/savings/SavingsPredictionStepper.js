import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState } from 'react';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Transition, Transitioning } from 'react-native-reanimated';
import { FloatingEmojis, FloatingEmojisTapHandler } from '../floating-emojis';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

const duration = 200;
const transition = (
  <Transition.Sequence>
    <Transition.Out durationMs={duration} interpolation="easeIn" type="fade" />
    <Transition.Change durationMs={50} interpolation="easeIn" />
    <Transition.In durationMs={duration} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

/* eslint-disable sort-keys */
const steps = {
  Monthly: {
    number: '$3.96',
    multiplier: 1,
  },
  Yearly: {
    number: '$47.48',
    multiplier: 1,
  },
  '5-Year': {
    number: '$331.28',
    multiplier: 1,
  },
  '10-Year': {
    number: '$923.50',
    multiplier: 1,
  },
  '20-Year': {
    number: '$3,874.76',
    multiplier: 1,
  },
  '50-Year': {
    number: '$140,187.19',
    multiplier: 1,
  },
};
/* eslint-enable sort-keys */

const SavingsPredictionStepper = ({ balance, interestRate }) => {
  const ref = useRef();

  if (ref.current) {
    ref.current.animateNextTransition();
  }

  const [step, setStep] = useState(0);
  const incrementStep = useCallback(() => {
    setStep(p => (p + 1 === Object.keys(steps).length ? 0 : p + 1));
  }, [setStep]);

  return (
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
          <Transitioning.View ref={ref} transition={transition}>
            <Text
              color={colors.dodgerBlue}
              flexGrow={1}
              size="lmedium"
              weight="semibold"
            >
              {Object.values(steps)[step].number}
            </Text>
          </Transitioning.View>
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



    // <FloatingEmojis
    //   distance={350}
    //   duration={2000}
    //   emoji={Object.values(steps)[step].emoji}
    //   size={36}
    //   wiggleFactor={1}
    // >
    //   {({ onNewEmoji }) => (
    //     <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
    //     </FloatingEmojisTapHandler>
    //   )}
    // </FloatingEmojis>
