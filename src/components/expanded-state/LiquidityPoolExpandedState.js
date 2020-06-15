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
    <SlackSheet scrollEnabled={false}>
      <LiquidityPoolExpandedStateHeader {...tokenAsset} />
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
        <DepositActionButton />
        <WithdrawActionButton />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(LiquidityPoolExpandedState, 'asset');
