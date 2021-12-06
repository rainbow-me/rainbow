import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import ArbitrumBadge from '../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../assets/badges/arbitrumBadgeDark.png';
import ArbitrumBadgeNoShadow from '../assets/badges/arbitrumBadgeNoShadow.png';
import OptimismBadge from '../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../assets/badges/optimismBadgeDark.png';
import OptimismBadgeNoShadow from '../assets/badges/optimismBadgeNoShadow.png';
import PolygonBadge from '../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../assets/badges/polygonBadgeDark.png';
import PolygonBadgeNoShadow from '../assets/badges/polygonBadgeNoShadow.png';
import { Centered } from './layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const ChainIcon = styled(FastImage)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type 'ThemedStyl... Remove this comment to see the full error message
  height: ${({ size }) => size};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type 'ThemedStyl... Remove this comment to see the full error message
  top: ${({ size }) => (size * 20) / 44 / 5};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type 'ThemedStyl... Remove this comment to see the full error message
  width: ${({ size }) => size};
`;

const Content = styled(Centered)`
  ${({ size }) => position.size((size * 20) / 44)};
  overflow: visible;
`;

export default function ChainLogo({
  network,
  size = 44,
  withShadows = true,
  ...props
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode } = useTheme();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const source = useMemo(() => {
    let val = null;
    if (network === networkTypes.arbitrum) {
      val = withShadows
        ? isDarkMode
          ? ArbitrumBadgeDark
          : ArbitrumBadge
        : ArbitrumBadgeNoShadow;
    } else if (network === networkTypes.optimism) {
      val = withShadows
        ? isDarkMode
          ? OptimismBadgeDark
          : OptimismBadge
        : OptimismBadgeNoShadow;
    } else if (network === networkTypes.polygon) {
      val = withShadows
        ? isDarkMode
          ? PolygonBadgeDark
          : PolygonBadge
        : PolygonBadgeNoShadow;
    }
    return val;
  }, [isDarkMode, network, withShadows]);

  if (!source) return null;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Content size={size} {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChainIcon size={size} source={source} />
    </Content>
  );
}
