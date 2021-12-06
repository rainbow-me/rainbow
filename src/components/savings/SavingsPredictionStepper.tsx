import React, { useCallback } from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { AnimatedNumber, Emoji, Text } from '../text';
import {
  calculateEarningsInDays,
  isSymbolStablecoin,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/savings' o... Remove this comment to see the full error message
} from '@rainbow-me/helpers/savings';
import {
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
} from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useStepper } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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

const SavingsPredictionStepper = ({ asset, balance, interestRate }: any) => {
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      duration={120}
      onPress={nextStep}
      scaleTo={1.04}
      width="100%"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row align="center" css={padding(15, 19, 19)}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins align="center" margin={5}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CrystalBallEmoji />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color={colors.dark} size="lmedium" weight="medium">
            {`Est. ${Object.keys(steps)[step]} Earnings`}
          </Text>
        </RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row flex={1} justify="end">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
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
