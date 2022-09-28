import lang from 'i18n-js';
import React from 'react';
import { SwapDetailsLabel, SwapDetailsValue } from './SwapDetailsRow';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { CoinIcon } from '@/utils';
import { Column, Columns, Rows } from '@/design-system';
import styled from '@/styled-thing';
import { ImgixImage } from '@/components/images';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.blueGreyDark,
}))({
  height: 11,
  top: 0,
  width: 7,
});

export default function SwapDetailsRefuelRow({ tradeDetails, testID }) {
  const fromAsset = tradeDetails?.refuel?.fromAsset;
  const toAsset = tradeDetails?.refuel?.toAsset;
  const toAmount = convertRawAmountToBalance(tradeDetails?.refuel?.toAmount, {
    decimals: 18,
  });
  const toSymbol = tradeDetails?.refuel?.toAsset?.symbol;

  return (
    <Rows testID={testID}>
      <Columns alignVertical="center" space="4px">
        <Column>
          <SwapDetailsLabel>
            {lang.t('expanded_state.swap_details.refuel')}
          </SwapDetailsLabel>
        </Column>

        <Column width="content">
          <CoinIcon
            address={fromAsset?.address}
            symbol={fromAsset?.symbol}
            size={20}
          />
        </Column>
        <Column width="content">
          <CaretIcon />
        </Column>
        <Column width="content">
          <CoinIcon
            address={toAsset?.address}
            symbol={toAsset?.symbol}
            size={20}
          />
        </Column>

        <Column width="content">
          <SwapDetailsValue>{`${toAmount.display}${toSymbol}`}</SwapDetailsValue>
        </Column>
      </Columns>
    </Rows>
  );
}
