import React from 'react';
import styled from 'styled-components';
import OptimismBadge from '../assets/optimismBadge.png';
import PolygonBadge from '../assets/polygonBadge.png';
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

export default function L2Logo({ assetType, size = 40, ...props }) {
  const { colors } = useTheme();
  const source = useMemo(() => {
    let val = null;
    if (assetType === AssetType.optimism) {
      val = OptimismBadge;
    } else if (assetType === AssetType.polygon) {
      val = PolygonBadge;
    }
    return val;
  }, [assetType]);

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
