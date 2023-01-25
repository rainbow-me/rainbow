import React from 'react';
import { useSelector } from 'react-redux';
import { UniswapInvestmentRow } from '../../investment-cards';
import { Bleed } from '@/design-system';
import { readableUniswapSelector } from '@/helpers/uniswapLiquidityTokenInfoSelector';

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
    // This 'Bleed' element moves the rows visually closer to the header, but since they
    // have a fixed height in the recycler list, it doesn't affect the overall list height.
    <Bleed top={6}>
      <UniswapInvestmentRow assetType="uniswap" item={found} />
    </Bleed>
  );
});
