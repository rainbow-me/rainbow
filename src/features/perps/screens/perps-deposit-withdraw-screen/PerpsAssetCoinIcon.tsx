import React from 'react';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { usePerpsDepositContext } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositContext';

export const PerpsAssetCoinIcon = ({ size, showBadge }: { size: number; showBadge?: boolean }) => {
  const { useDepositStore } = usePerpsDepositContext();
  const asset = useDepositStore(state => state.asset);
  if (!asset) return null;
  return <RainbowCoinIcon chainId={asset.chainId} symbol={asset.symbol} icon={asset.icon_url} size={size} showBadge={showBadge} />;
};
