import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
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
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetType } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const sizeConfigs = {
  large: {
    containerSize: 64,
    iconSize: 40,
  },
  medium: {
    containerSize: 44,
    iconSize: 20,
  },
  small: {
    containerSize: 44,
    iconSize: 20,
  },
  tiny: {
    containerSize: 22,
    iconSize: 10,
  },
};

const ChainIcon = styled(FastImage)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'containerSize' does not exist on type 'T... Remove this comment to see the full error message
  height: ${({ containerSize }) => containerSize};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'iconSize' does not exist on type 'Themed... Remove this comment to see the full error message
  top: ${({ iconSize }) => iconSize / 5};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'containerSize' does not exist on type 'T... Remove this comment to see the full error message
  width: ${({ containerSize }) => containerSize};
`;

const IndicatorIconContainer = styled(Centered)`
  bottom: ${({ badgeYPosition, position }) =>
    position === 'relative' ? 0 : badgeYPosition};
  left: ${({ badgeXPosition, position }) =>
    position === 'relative' ? 0 : badgeXPosition};
  ${({ iconSize }) => position.size(iconSize)};
  margin-bottom: ${({ marginBottom }) => marginBottom};
  overflow: visible;
  position: ${({ position }) => position || 'absolute'};
  z-index: 10;
  elevation: 10;
`;

export default function ChainBadge({
  assetType,
  badgeXPosition = -7,
  badgeYPosition = 0,
  marginBottom = 0,
  position,
  size = 'small',
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode } = useTheme();

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const { containerSize, iconSize } = sizeConfigs[size];

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const source = useMemo(() => {
    let val = null;
    if (size === 'large') {
      if (assetType === AssetType.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeLargeDark : ArbitrumBadgeLarge;
      } else if (assetType === AssetType.optimism) {
        val = isDarkMode ? OptimismBadgeLargeDark : OptimismBadgeLarge;
      } else if (assetType === AssetType.polygon) {
        val = isDarkMode ? PolygonBadgeLargeDark : PolygonBadgeLarge;
      }
    } else {
      if (assetType === AssetType.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
      } else if (assetType === AssetType.optimism) {
        val = isDarkMode ? OptimismBadgeDark : OptimismBadge;
      } else if (assetType === AssetType.polygon) {
        val = isDarkMode ? PolygonBadgeDark : PolygonBadge;
      }
    }
    return val;
  }, [assetType, isDarkMode, size]);

  if (!source) return null;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <IndicatorIconContainer
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
      iconSize={iconSize}
      marginBottom={marginBottom}
      position={position}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChainIcon
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        containerSize={containerSize}
        iconSize={iconSize}
        source={source}
      />
    </IndicatorIconContainer>
  );
}
