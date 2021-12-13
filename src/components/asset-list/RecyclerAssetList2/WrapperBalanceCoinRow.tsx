import React from 'react';
import { BalanceCoinRow } from '../../coin-row';
import { AssetType } from '@rainbow-me/entities';
import { useAsset } from '@rainbow-me/hooks';

export default React.memo(function WrapperBalanceCoinRow({
  uniqueId,
}: {
  uniqueId: string;
}) {
  const token = useAsset({
    type: AssetType.token,
    uniqueId,
  });

  return <BalanceCoinRow item={token} />;
});
