import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import React from 'react';

export const PerpsAssetCoinIcon = ({
  asset,
  size,
  showBadge,
}: {
  asset: ExtendedAnimatedAssetWithColors | null;
  size: number;
  showBadge?: boolean;
}) => {
  if (!asset) return null;
  return <RainbowCoinIcon chainId={asset.chainId} symbol={asset.symbol} icon={asset.icon_url} size={size} showBadge={showBadge} />;
};
