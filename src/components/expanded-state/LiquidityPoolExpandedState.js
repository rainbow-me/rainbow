import React, { useMemo } from 'react';
import { tokenOverrides } from '../../references';
import { magicMemo } from '../../utils';
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

export const LiquidityPoolExpandedStateSheetHeight = 369;

const LiquidityPoolExpandedState = ({
  asset: { ethBalance, totalNativeDisplay, uniBalance, ...asset },
}) => {
  const ethAsset = useMemo(
    () => ({
      color: tokenOverrides['eth'].color,
      symbol: 'ETH',
      value: ethBalance,
    }),
    [ethBalance]
  );

  const tokenAsset = useMemo(() => {
    const { tokenAddress, tokenBalance, tokenSymbol, ...tokenAsset } = asset;
    return {
      ...tokenAsset,
      ...(tokenAddress ? tokenOverrides[tokenAddress.toLowerCase()] : {}),
      address: tokenAddress,
      symbol: tokenSymbol,
      value: tokenBalance,
    };
  }, [asset]);

  return (
    <SlackSheet contentHeight={LiquidityPoolExpandedStateSheetHeight}>
      <LiquidityPoolExpandedStateHeader asset={tokenAsset} />
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          <TokenInfoItem
            asset={tokenAsset}
            title={`${tokenAsset.symbol} balance`}
          >
            <TokenInfoBalanceValue />
          </TokenInfoItem>
          <TokenInfoItem asset={ethAsset} title="ETH balance">
            <TokenInfoBalanceValue />
          </TokenInfoItem>
        </TokenInfoRow>
        <TokenInfoRow>
          <TokenInfoItem title="Pool shares">{uniBalance}</TokenInfoItem>
          <TokenInfoItem title="Total value">
            {totalNativeDisplay}
          </TokenInfoItem>
        </TokenInfoRow>
      </TokenInfoSection>
      <SheetActionButtonRow>
        <WithdrawActionButton symbol={tokenAsset.symbol} />
        <DepositActionButton symbol={tokenAsset.symbol} />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(LiquidityPoolExpandedState, 'asset');
