import React from 'react';
import { BalanceCoinRow } from '../../coin-row';
import { useAccountAsset } from '@rainbow-me/hooks';

export default React.memo(function WrappedBalanceCoinRow({
  uniqueId,
}: {
  uniqueId: string;
}) {
  const token = useAccountAsset(uniqueId);
  return <BalanceCoinRow item={token} />;
});
