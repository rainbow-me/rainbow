import React, { useMemo } from 'react';
import { ChainId } from '@/state/backendNetworks/types';
import FastImage, { Source } from 'react-native-fast-image';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export function ChainImage({
  chainId,
  size = 20,
  showBadge = true,
}: {
  chainId: ChainId | null | undefined;
  size?: number;
  showBadge?: boolean;
}) {
  const source = useMemo(() => {
    if (!chainId) return { uri: '' };

    const badgeUrl = useBackendNetworksStore.getState().getChainsBadge()[chainId];
    if (!badgeUrl) return { uri: '' };

    return { uri: badgeUrl };
  }, [chainId]);

  if (!chainId || !source.uri || !showBadge) return null;

  return (
    <FastImage key={`${chainId}-badge-${size}`} source={source as Source} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
}
