import React from 'react';
import styled from 'styled-components';
import ArbitrumBadge from '../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../assets/badges/optimismBadgeDark.png';
import PolygonBadge from '../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../assets/badges/polygonBadgeDark.png';
import { Centered } from './layout';
import { AssetType } from '@rainbow-me/entities';
import { ImgixImage } from '@rainbow-me/images';
import { position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const ChainIcon = styled(ImgixImage)`
  height: ${({ size }) => size};
  margin-top: 1;
  width: ${({ size }) => size};
`;

const RVLIBorderRadius = 16.25;
const RVLIShadows = colors => ({
  default: [
    [0, 4, 6, colors.shadow, 0.04],
    [0, 1, 3, colors.shadow, 0.08],
  ],
  large: [[0, 6, 10, colors.shadow, 0.14]],
});

const Content = styled(Centered)`
  ${({ size }) => position.size(size)};
`;

export default function ChainLogo({ assetType, size = 40, ...props }) {
  const { colors, isDarkMode } = useTheme();
  const source = useMemo(() => {
    let val = null;
    if (assetType === AssetType.arbitrum) {
      val = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
    } else if (assetType === AssetType.optimism) {
      val = isDarkMode ? OptimismBadgeDark : OptimismBadge;
    } else if (assetType === AssetType.polygon) {
      val = isDarkMode ? PolygonBadgeDark : PolygonBadge;
    }
    return val;
  }, [assetType, isDarkMode]);

  if (!source) return null;

  return (
    <ShadowStack
      {...props}
      {...position.sizeAsObject(size)}
      backgroundColor={colors.white}
      borderRadius={RVLIBorderRadius}
      shadows={RVLIShadows(colors)['default']}
    >
      <Content size={size}>
        <ChainIcon size={size} source={source} />
      </Content>
    </ShadowStack>
  );
}
