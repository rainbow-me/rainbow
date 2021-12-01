import React from 'react';
import { BalanceCoinRow } from '../../coin-row';
import { useAsset } from '@rainbow-me/hooks';

export default function WrapperBalanceCoinRow({ uniqueId, ...props }) {
  const token = useAsset({
    type: 'token',
    uniqueId,
  });

  return <BalanceCoinRow {...props} item={token} />;
}
