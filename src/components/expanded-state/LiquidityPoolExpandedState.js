import { map } from 'lodash';
import React, { useMemo } from 'react';
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
import { LiquidityPoolExpandedStateHeader } from './liquidity-pool';
import { getTokenMetadata, magicMemo } from '@rainbow-me/utils';

export const LiquidityPoolExpandedStateSheetHeight = 369 + (android ? 80 : 0);

const LiquidityPoolExpandedState = ({
  asset: {
    name,
    pricePerShare,
    totalNativeDisplay,
    uniBalance,
    ...liquidityInfo
  },
}) => {
  const tokenAssets = useMemo(() => {
    const { tokens } = liquidityInfo;
    return map(tokens, token => {
      const metadata = getTokenMetadata(token.address);
      return {
        ...token,
        ...metadata,
        value: token.balance,
      };
    });
  }, [liquidityInfo]);

  return (
    <SlackSheet
      additionalTopPadding={android}
      contentHeight={LiquidityPoolExpandedStateSheetHeight}
    >
      <LiquidityPoolExpandedStateHeader
        assets={tokenAssets}
        name={name}
        pricePerShare={pricePerShare}
      />
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          {map(tokenAssets, tokenAsset => {
            return (
              <TokenInfoItem
                asset={tokenAsset}
                key={`tokeninfo-${tokenAsset.symbol}`}
                title={`${tokenAsset.symbol} balance`}
              >
                <TokenInfoBalanceValue />
              </TokenInfoItem>
            );
          })}
        </TokenInfoRow>
        <TokenInfoRow>
          <TokenInfoItem title="Pool shares">{uniBalance}</TokenInfoItem>
          <TokenInfoItem title="Total value">
            {totalNativeDisplay}
          </TokenInfoItem>
        </TokenInfoRow>
      </TokenInfoSection>
      <SheetActionButtonRow>
        <WithdrawActionButton symbol={name} weight="bold" />
        <DepositActionButton symbol={name} weight="bold" />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(LiquidityPoolExpandedState, 'asset');
