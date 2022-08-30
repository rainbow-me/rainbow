import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { AnimatedNumber, Emoji, Text } from '../text';
import { calculateEarningsInDays, isSymbolStablecoin } from '@/helpers/savings';
import {
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { useAccountSettings, useStepper } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { magicMemo } from '@/utils';

const CrystalBallEmoji = styled(Emoji).attrs({
  name: 'crystal_ball',
  size: 'medium',
})({
  marginBottom: 0.5,
});

const PredictionNumber = styled(AnimatedNumber).attrs(
  ({ theme: { colors } }) => ({
    color: colors.swapPurple,
    letterSpacing: 'roundedTight',
    size: 'lmedium',
    weight: 'semibold',
  })
)({
  flexGrow: 1,
});

const steps = {
  'Monthly': {
    label: lang.t('savings.earnings.monthly'),
    days: 30,
  },
  'Yearly': {
    label: lang.t('savings.earnings.yearly'),
    days: 365,
  },
  '5-Year': {
    label: lang.t('savings.earnings.5_year'),
    days: 365 * 5,
  },
  '10-Year': {
    label: lang.t('savings.earnings.10_year'),
    days: 365 * 10,
  },
  '20-Year': {
    label: lang.t('savings.earnings.20_year'),
    days: 365 * 20,
  },
  '50-Year': {
    label: lang.t('savings.earnings.50_year'),
    days: 365 * 50,
  },
  '100-Year': {
    label: lang.t('savings.earnings.100_year'),
    days: 365 * 100,
  },
};

const rowStyle = padding.object(15, 19, 19);

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
      <Row align="center" style={rowStyle}>
        <RowWithMargins align="center" margin={5}>
          <CrystalBallEmoji />
          <Text color={colors.dark} size="lmedium" weight="medium">
            {`${lang.t('savings.earnings.est')} ${
              Object.keys(steps)[step]
            } ${lang.t('savings.earnings.label')}`}
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
