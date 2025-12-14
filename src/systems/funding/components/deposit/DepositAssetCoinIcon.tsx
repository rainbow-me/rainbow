import React from 'react';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { ChainId } from '@/state/backendNetworks/types';
import { useDepositContext } from '../../contexts/DepositContext';

export const DepositAssetCoinIcon = ({ showBadge, size }: { showBadge?: boolean; size: number }) => {
  const { useDepositStore } = useDepositContext();
  const asset = useDepositStore(state => state.asset);

  if (!asset) return null;

  return (
    <RainbowCoinIcon
      chainId={asset.chainId}
      chainSize={16}
      icon={asset.icon_url}
      showBadge={showBadge && asset.chainId !== ChainId.mainnet}
      size={size}
      symbol={asset.symbol}
    />
  );
};
