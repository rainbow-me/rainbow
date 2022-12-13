import React from 'react';
import FastImage from 'react-native-fast-image';
import ArbitrumBadge from '../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../assets/badges/arbitrumBadgeDark.png';
import ArbitrumBadgeLarge from '../../assets/badges/arbitrumBadgeLarge.png';
import ArbitrumBadgeLargeDark from '../../assets/badges/arbitrumBadgeLargeDark.png';
import OptimismBadge from '../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../assets/badges/optimismBadgeDark.png';
import OptimismBadgeLarge from '../../assets/badges/optimismBadgeLarge.png';
import OptimismBadgeLargeDark from '../../assets/badges/optimismBadgeLargeDark.png';
import PolygonBadge from '../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../assets/badges/polygonBadgeDark.png';
import PolygonBadgeLarge from '../../assets/badges/polygonBadgeLarge.png';
import PolygonBadgeLargeDark from '../../assets/badges/polygonBadgeLargeDark.png';
import BscBadge from '../../assets/badges/bscBadge.png';
import BscBadgeDark from '../../assets/badges/bscBadgeDark.png';
import BscBadgeLarge from '../../assets/badges/bscBadgeLarge.png';
import BscBadgeLargeDark from '../../assets/badges/bscBadgeLargeDark.png';
import { Centered } from '../layout';
import { AssetType } from '@/entities';
import styled from '@/styled-thing';
import { position as positions } from '@/styles';
import { ChainBadgeSizeConfigs } from '@/components/coin-icon/ChainBadgeSizeConfigs';

const ChainIcon = styled(FastImage)({
  height: ({ containerSize }) => containerSize,
  top: ({ iconSize }) => iconSize / 5,
  width: ({ containerSize }) => containerSize,
});

const IndicatorIconContainer = styled(Centered)(
  ({ marginBottom, iconSize, badgeXPosition, badgeYPosition, position }) => ({
    bottom: position === 'relative' ? 0 : badgeYPosition,
    left: position === 'relative' ? 0 : badgeXPosition,
    ...positions.sizeAsObject(iconSize),
    elevation: 10,
    marginBottom,
    overflow: 'visible',
    position: position || 'absolute',
    zIndex: 10,
  })
);

export default function ChainBadge({
  assetType,
  badgeXPosition = -7,
  badgeYPosition = 0,
  marginBottom = 0,
  position = 'absolute',
  size = 'small',
}) {
  const { isDarkMode } = useTheme();
  const { containerSize, iconSize } = ChainBadgeSizeConfigs[size];

  const source = useMemo(() => {
    let val = null;
    if (size === 'large') {
      if (assetType === AssetType.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeLargeDark : ArbitrumBadgeLarge;
      } else if (assetType === AssetType.optimism) {
        val = isDarkMode ? OptimismBadgeLargeDark : OptimismBadgeLarge;
      } else if (assetType === AssetType.polygon) {
        val = isDarkMode ? PolygonBadgeLargeDark : PolygonBadgeLarge;
      } else if (assetType === AssetType.bsc) {
        val = isDarkMode ? BscBadgeLargeDark : BscBadgeLarge;
      }
    } else {
      if (assetType === AssetType.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
      } else if (assetType === AssetType.optimism) {
        val = isDarkMode ? OptimismBadgeDark : OptimismBadge;
      } else if (assetType === AssetType.polygon) {
        val = isDarkMode ? PolygonBadgeDark : PolygonBadge;
      } else if (assetType === AssetType.bsc) {
        val = isDarkMode ? BscBadgeDark : BscBadge;
      }
    }
    return val;
  }, [assetType, isDarkMode, size]);

  if (!source) return null;

  return (
    <IndicatorIconContainer
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
      iconSize={iconSize}
      marginBottom={marginBottom}
      position={position}
    >
      <ChainIcon
        containerSize={containerSize}
        iconSize={iconSize}
        source={source}
      />
    </IndicatorIconContainer>
  );
}
