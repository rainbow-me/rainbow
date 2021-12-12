import React from 'react';
import { useSelector } from 'react-redux';
import { UniswapInvestmentRow } from '../../investment-cards';
import { Bleed } from '@rainbow-me/design-system';
import { readableUniswapSelector } from '@rainbow-me/helpers/uniswapLiquidityTokenInfoSelector';

export default React.memo(function WrappedPoolRow({
  address,
}: {
  address: string;
}) {
  const { uniswap } = useSelector(readableUniswapSelector);
  const found = uniswap.find(
    ({ address: uniswapAddress }) => uniswapAddress === address
  );

  return (
    <Bleed top="6px">
      <UniswapInvestmentRow assetType="uniswap" item={found} />
    </Bleed>
  );
});
