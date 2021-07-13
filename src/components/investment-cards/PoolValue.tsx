import React from 'react';
import styled from 'styled-components';
import { Row } from '../layout';
import { Text } from '../text';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import { useAccountSettings } from '@rainbow-me/hooks';
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
  ${android && 'line-height: 28px; height: 30px;'}
`;

export const PoolValue = ({ type, value, simple, ...props }) => {
  let formattedValue = value;
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
    if (fixedPercent > 0) {
      color = colors.green;
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
    <PoolValueWrapper
      backgroundColor={colors.alpha(color, simple ? 0 : 0.06)}
      simple={simple}
    >
      <PoolValueText color={color} simple={simple} {...props}>
        {formattedValue}
      </PoolValueText>
    </PoolValueWrapper>
  );
};
