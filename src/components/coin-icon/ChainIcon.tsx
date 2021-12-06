import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import ArbitrumBadge from '../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../assets/badges/optimismBadgeDark.png';
import PolygonBadge from '../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../assets/badges/polygonBadgeDark.png';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetType } from '@rainbow-me/entities';

const sizeConfigs = {
  large: {
    iconSize: 60,
  },
  medium: {
    iconSize: 45,
  },
  small: {
    iconSize: 40,
  },
};

const Container = styled(Centered)`
  border-radius: ${({ iconSize }) => iconSize / 2};
  height: ${({ iconSize }) => iconSize / 2};
  width: ${({ iconSize }) => iconSize / 2};
  overflow: visible;
`;
const Icon = styled(FastImage)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'iconSize' does not exist on type 'Themed... Remove this comment to see the full error message
  height: ${({ iconSize }) => iconSize};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'iconSize' does not exist on type 'Themed... Remove this comment to see the full error message
  width: ${({ iconSize }) => iconSize};
  top: 4;
`;

export default function ChainIcon({ assetType, size = 'small' }: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode } = useTheme();

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const { iconSize } = sizeConfigs[size];

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container iconSize={iconSize}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Icon iconSize={iconSize} source={source} />
    </Container>
  );
}
