import React from 'react';
import { UniswapInvestmentRow } from '../investment-cards';
import { Column } from '../layout';
import { Text } from '../text';

const sample = {
  ethBalance: 0.0017,
  nativeDisplay: '$0.714',
  percentageOwned: '0.002791633932773133',
  pricePerShare: '$1,195.02',
  tokenAddress: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
  tokenBalance: 0.3457,
  tokenName: 'Sai',
  tokenSymbol: 'SAI',
  totalBalanceAmount: '1.4281594544978260747632',
  totalNativeDisplay: '$1.43',
  uniBalance: 0.001195,
  uniqueId: 'uniswap_0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
  uniTotalSupply: 42.8096419,
};

const renderUniswapInvestmentRow = item => (
  <UniswapInvestmentRow assetType="uniswap" item={item} key={item.uniqueId} />
);

export default function UniswapPools() {
  return (
    <Column paddingHorizontal={12}>
      <Text size="larger" weight="bold">
        🦄 Uniswap Pools
      </Text>
      {[sample, sample, sample, sample, sample, sample].map(
        renderUniswapInvestmentRow
      )}
    </Column>
  );
}
