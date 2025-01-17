import React from 'react';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { Box } from '@/design-system';
import { ParsedAddressAsset } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import { useTheme } from '@/theme';
import RainbowCoinIcon from './RainbowCoinIcon';

export function TwoCoinsIcon({
  badge = true,
  over,
  size = 40,
  under,
}: {
  badge?: boolean;
  over: ParsedAddressAsset;
  size?: number;
  under: ParsedAddressAsset;
}) {
  const theme = useTheme();
  const overSize = size * 0.85;
  const underSize = size * 0.75;

  return (
    <Box style={{ height: size, width: size }}>
      <Box
        borderRadius={100}
        style={{
          left: 0,
          position: 'absolute',
          top: 0,
          zIndex: 0,
        }}
      >
        <RainbowCoinIcon
          chainId={under.chainId as ChainId}
          icon={under?.icon_url}
          showBadge={false}
          size={underSize}
          symbol={under.symbol}
        />
      </Box>
      <Box
        style={{
          backgroundColor: theme.colors.white,
          borderRadius: size / 2,
          bottom: 0,
          height: overSize + 4,
          margin: -2,
          padding: 2,
          position: 'absolute',
          right: 0,
          width: overSize + 4,
        }}
      >
        <RainbowCoinIcon chainId={over.chainId as ChainId} icon={over?.icon_url} showBadge={false} size={overSize} symbol={over.symbol} />
      </Box>
      <ChainImage badgeYPosition={0} badgeXPosition={-9} chainId={over.chainId} showBadge={badge} size={20} style={{ zIndex: 1000 }} />
    </Box>
  );
}
