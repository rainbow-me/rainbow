import React from 'react';
import { Box } from '@/design-system';
import { ParsedAddressAsset } from '@/entities';
import { useTheme } from '@/theme';
import { ImgixImage } from '@/components/images';
import ChainBadge from './ChainBadge';

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
    <Box style={{ minWidth: size, height: size }}>
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
          <ImgixImage
            source={{ uri: under?.icon_url }}
            style={{ borderRadius: 100, width: underSize, height: underSize }}
            size={underSize}
          />
        </Box>
        <Box
          //   borderColor="surfaceSecondary"
          borderRadius={100}
          style={{ zIndex: 10, position: 'absolute', top: 0, right: 0 }}
        >
          <ImgixImage
            source={{ uri: over?.icon_url }}
            style={{
              borderRadius: 100,
              width: overSize,
              height: overSize,
              borderWidth: 2,
              borderColor: theme.colors.white,
            }}
            size={overSize}
          />
        </Box>
        {badge && <ChainBadge network={over.network} badgeYPosition={9} badgeXPosition={-7.5} />}
      </Box>
    </Box>
  );
}
