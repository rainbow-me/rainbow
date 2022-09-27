import lang from 'i18n-js';
import React from 'react';
import SwapDetailsRow from './SwapDetailsRow';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { CoinIcon } from '@/utils';
import { Box } from '@/design-system';

export default function SwapDetailsRefuelRow({ tradeDetails, testID }) {
  const fromAsset = tradeDetails?.refuel?.fromAsset;
  const toAsset = tradeDetails?.refuel?.toAsset;
  console.log(tradeDetails?.refuel?.toAmount);
  const toAmount = convertRawAmountToBalance(tradeDetails?.refuel?.toAmount, {
    decimals: 18,
  });
  const toSymbol = tradeDetails?.refuel?.toAsset?.symbol;

  return (
    <SwapDetailsRow
      label={`${lang.t('expanded_state.swap_details.refuel')}`}
      testID={testID}
    >
      <Box paddingRight="4px" flexDirection="row">
        <CoinIcon
          address={fromAsset?.address}
          symbol={fromAsset?.symbol}
          size={20}
        />

        <CoinIcon
          address={toAsset?.address}
          symbol={toAsset?.symbol}
          size={20}
        />
      </Box>
      {`${toAmount.display}${toSymbol}`}
    </SwapDetailsRow>
  );
}
