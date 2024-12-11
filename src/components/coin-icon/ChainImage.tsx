import React, { useMemo } from 'react';
import FastImage, { Source } from 'react-native-fast-image';
import { ChainId } from '@/chains/types';
import { chainsBadges } from '@/chains';

export function ChainImage({ chainId, size = 20 }: { chainId: ChainId | undefined; size?: number }) {
  const source: Source | undefined = useMemo(() => {
    if (!chainId) return { uri: undefined };
    const badgeUrl = chainsBadges[chainId];
    if (!badgeUrl) return { uri: undefined };
    return { uri: badgeUrl };
  }, [chainId]);

  return <FastImage key={`${chainId}-badge-${size}`} source={source} style={{ borderRadius: size / 2, height: size, width: size }} />;
}
