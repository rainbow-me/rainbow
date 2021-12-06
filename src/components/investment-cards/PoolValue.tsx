import React from 'react';
import styled from 'styled-components';
import { Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/bigNumberF... Remove this comment to see the full error message
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const PoolValueWrapper = styled(Row)`
  border-radius: ${({ simple }) => (simple ? 0 : 15)};
  ${({ simple }) => (simple ? undefined : 'height: 30')};
  ${({ simple }) => (simple ? undefined : padding(2, 9, 0))};
`;

const PoolValueText = styled(Text).attrs(({ simple, size }) => ({
  align: simple ? 'left' : 'center',
  letterSpacing: 'roundedTight',
  lineHeight: simple ? undefined : 'paragraphSmall',
  size: size || 'lmedium',
  weight: simple ? 'semibold' : 'bold',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android && 'line-height: 28px; height: 30px;'}
`;

export const PoolValue = ({ type, value, simple, ...props }: any) => {
  let formattedValue = value;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  let color = type === 'oneDayVolumeUSD' ? colors.swapPurple : colors.appleBlue;
  const { nativeCurrency } = useAccountSettings();

  if (type === 'annualized_fees' || type === 'profit30d') {
    let percent = parseFloat(value);
    if (!percent || percent === 0) {
      formattedValue = '0%';
    }

    if (percent < 0.0001 && percent > 0) {
      formattedValue = '< 0.0001%';
    }

    if (percent < 0 && percent > -0.0001) {
      formattedValue = '< 0.0001%';
    }

    let fixedPercent = percent.toFixed(2);
    if (fixedPercent === '0.00') {
      formattedValue = '0%';
    }
    // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'string' a... Remove this comment to see the full error message
    if (fixedPercent > 0) {
      color = colors.green;
      // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'string' a... Remove this comment to see the full error message
      if (fixedPercent > 100) {
        formattedValue = `+${percent
          ?.toFixed(2)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`;
      } else {
        formattedValue = `+${fixedPercent}%`;
      }
    } else {
      formattedValue = `${fixedPercent}%`;
      color = colors.red;
    }
  } else if (type === 'liquidity' || type === 'oneDayVolumeUSD') {
    formattedValue = bigNumberFormat(value, nativeCurrency, value >= 10000);
  }
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <PoolValueWrapper
      backgroundColor={colors.alpha(color, simple ? 0 : 0.06)}
      simple={simple}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PoolValueText color={color} simple={simple} {...props}>
        {formattedValue}
      </PoolValueText>
    </PoolValueWrapper>
  );
};
