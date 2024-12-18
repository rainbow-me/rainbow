import React from 'react';
import { Box } from '@/design-system';
import { ParsedAddressAsset } from '@/entities';
import { useTheme } from '@/theme';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import RainbowCoinIcon from './RainbowCoinIcon';
import { ChainId } from '@/state/backendNetworks/types';

export function TwoCoinsIcon({
  size = 45,
  under,
  over,
  badge = true,
}: {
  size?: number;
  under: ParsedAddressAsset;
  over: ParsedAddressAsset;
  badge?: boolean;
}) {
  const theme = useTheme();
  const overSize = size * 0.85;
  const underSize = size * 0.75;

  return (
    <Box style={{ minWidth: size, height: size, marginRight: -5 }}>
      <Box
        style={{
          position: 'absolute',
          top: 8,
          right: 4,
          minWidth: size,
          height: size,
        }}
      >
        <Box
          borderRadius={100}
          style={{
            zIndex: 0,
            position: 'absolute',
            top: -underSize / 4,
            left: -0,
          }}
        >
          <RainbowCoinIcon
            icon={under?.icon_url}
            size={underSize}
            chainId={under.chainId as ChainId}
            symbol={under.symbol}
            showBadge={false}
          />
        </Box>
        <Box
          borderRadius={100}
          style={{ zIndex: 10, position: 'absolute', top: 0, right: 0, borderRadius: 99, borderColor: theme.colors.white, borderWidth: 2 }}
        >
          <RainbowCoinIcon icon={over?.icon_url} size={overSize} chainId={over.chainId as ChainId} symbol={over.symbol} showBadge={false} />
        </Box>
        <ChainImage showBadge={badge} chainId={over.chainId} badgeYPosition={8.5} badgeXPosition={-10} size={32} />
      </Box>
    </Box>
  );
}
