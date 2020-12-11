import { map } from 'lodash';
import React from 'react';
import {
  DepositActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  WithdrawActionButton,
} from '../sheet';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../token-info';
import ChartState from './chart/ChartState';
import { magicMemo } from '@rainbow-me/utils';

const heightWithoutChart = 373 + (android ? 80 : 0);
const heightWithChart = heightWithoutChart + 292;

export const LiquidityPoolExpandedStateSheetHeight = heightWithChart;

const LiquidityPoolExpandedState = ({ asset }) => {
  const { tokenNames, tokens, totalNativeDisplay, type, uniBalance } = asset;
  const tokenType = type === 'uniswap' ? 'UNI-V1' : 'UNI-V2';
  const uniBalanceLabel = `${uniBalance} ${tokenType}`;

  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={LiquidityPoolExpandedStateSheetHeight}
    >
      <ChartState
        asset={asset}
        heightWithChart={heightWithChart}
        heightWithoutChart={heightWithoutChart}
        isPool
      />
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          {map(tokens, tokenAsset => (
            <TokenInfoItem
              asset={tokenAsset}
              key={`tokeninfo-${tokenAsset.symbol}`}
              title={`${tokenAsset.symbol} balance`}
            >
              <TokenInfoBalanceValue />
            </TokenInfoItem>
          ))}
        </TokenInfoRow>
        <TokenInfoRow>
          <TokenInfoItem title="Pool shares">{uniBalanceLabel}</TokenInfoItem>
          <TokenInfoItem title="Total value" weight="bold">
            {totalNativeDisplay}
          </TokenInfoItem>
        </TokenInfoRow>
      </TokenInfoSection>
      <SheetActionButtonRow>
        <WithdrawActionButton symbol={tokenNames} weight="bold" />
        <DepositActionButton symbol={tokenNames} weight="bold" />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(LiquidityPoolExpandedState, 'asset');
