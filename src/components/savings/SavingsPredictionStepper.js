import React, { useCallback } from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { AnimatedNumber, Emoji, Text } from '../text';
import {
  calculateEarningsInDays,
  isSymbolStablecoin,
} from '@rainbow-me/helpers/savings';
import {
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@rainbow-me/helpers/utilities';
import { useAccountSettings, useStepper } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const CrystalBallEmoji = styled(Emoji).attrs({
  name: 'crystal_ball',
  size: 'medium',
})`
  margin-bottom: 0.5;
`;

const PredictionNumber = styled(AnimatedNumber).attrs(
  ({ theme: { colors } }) => ({
    color: colors.swapPurple,
    letterSpacing: 'roundedTight',
    size: 'lmedium',
    weight: 'semibold',
  })
)`
  flex-grow: 1;
`;

/* eslint-disable sort-keys-fix/sort-keys-fix */
const steps = {
  'Monthly': {
    days: 30,
  },
  'Yearly': {
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
/* eslint-enable sort-keys-fix/sort-keys-fix */

const SavingsPredictionStepper = ({ asset, balance, interestRate }) => {
  const { nativeCurrency } = useAccountSettings();
  const [step, nextStep] = useStepper(Object.keys(steps).length, 1);
  const { decimals, symbol } = asset;

  const estimatedEarnings = calculateEarningsInDays(
    balance,
    interestRate,
    Object.values(steps)[step].days
  );

  const formatter = useCallback(
    value => {
      return isSymbolStablecoin(symbol)
        ? convertAmountToNativeDisplay(value, nativeCurrency)
        : `${handleSignificantDecimals(value, decimals, 1)} ${symbol}`;
    },
    [decimals, symbol, nativeCurrency]
  );
  const { colors } = useTheme();

  return (
    <ButtonPressAnimation
      duration={120}
      onPress={nextStep}
      scaleTo={1.04}
      width="100%"
    >
      <Row align="center" css={padding(15, 19, 19)}>
        <RowWithMargins align="center" margin={5}>
          <CrystalBallEmoji />
          <Text color={colors.dark} size="lmedium">
            {`Est. ${Object.keys(steps)[step]} Earnings`}
          </Text>
        </RowWithMargins>
        <Row flex={1} justify="end">
          <PredictionNumber
            disableTabularNums
            formatter={formatter}
            steps={9}
            time={8}
            value={estimatedEarnings}
          />
        </Row>
      </Row>
    </ButtonPressAnimation>
  );
};

export default magicMemo(SavingsPredictionStepper, ['balance', 'interestRate']);
