import React from 'react';
import styled from 'styled-components';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { Row } from '../layout';
import { Text } from '../text';
import { useAccountSettings } from '@rainbow-me/hooks';

const PoolValueWrapper = styled(Row)`
  border-radius: 15px;
  height: 30px;
  padding-horizontal: 9px;
  padding-top: 2px;
`;

const PoolValueText = styled(Text).attrs({
  align: 'center',
  letterSpacing: 'roundedTight',
  lineHeight: 'paragraphSmall',
  size: 'lmedium',
  weight: 'bold',
})`
  ${android && 'padding-top: 3px'}
`;

const bigNumberFormat = (num, nativeCurrency) => {
  let ret;
  if (num > 1000000000) {
    ret = `${convertAmountToNativeDisplay(
      (num / 1000000000).toString(),
      nativeCurrency
    )}b`;
  } else if (num > 1000000) {
    ret = `${convertAmountToNativeDisplay(
      (num / 1000000).toString(),
      nativeCurrency
    )}m`;
  } else {
    ret = convertAmountToNativeDisplay(num.toString(), nativeCurrency);
    num.toFixed(2);
  }

  return ret;
};

export const PoolValue = ({ type, value, simple = true }) => {
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
        formattedValue = `+${percent?.toFixed(2).toString()}%`;
      } else {
        formattedValue = `+${fixedPercent}%`;
      }
    } else {
      formattedValue = `${fixedPercent}%`;
      color = colors.red;
    }
  } else if (type === 'liquidity' || type === 'oneDayVolumeUSD') {
    formattedValue = bigNumberFormat(value, nativeCurrency);
  }
  return (
    <PoolValueWrapper backgroundColor={colors.alpha(color, simple ? 0 : 0.06)}>
      <PoolValueText color={color}>{formattedValue}</PoolValueText>
    </PoolValueWrapper>
  );
};
