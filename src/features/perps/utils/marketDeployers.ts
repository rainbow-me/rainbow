import { type ImageSourcePropType } from 'react-native';

import entropyLogo from '@/features/perps/assets/deployers/entropy.png';
import kinetiqLogo from '@/features/perps/assets/deployers/kinetiq.png';
import paragonLogo from '@/features/perps/assets/deployers/paragon.png';
import tradeXyzLogo from '@/features/perps/assets/deployers/tradeXyz.png';

export type MarketDeployer = { kind: 'hyperliquid'; name: string } | { kind: 'builder'; name: string; logo?: ImageSourcePropType };

export const HYPERLIQUID_NAME = 'Hyperliquid';

const HYPERLIQUID_DEPLOYER: MarketDeployer = { kind: 'hyperliquid', name: HYPERLIQUID_NAME };

const BUILDER_DEPLOYERS: Partial<Record<string, Extract<MarketDeployer, { kind: 'builder' }>>> = {
  xyz: { kind: 'builder', name: 'Trade XYZ', logo: tradeXyzLogo },
  para: { kind: 'builder', name: 'Paragon', logo: paragonLogo },
  io: { kind: 'builder', name: 'Entropy', logo: entropyLogo },
  mkts: { kind: 'builder', name: 'Markets by Kinetiq', logo: kinetiqLogo },
};

/**
 * `dex` is the market's Hyperliquid dex id (`''` for Hyperliquid's own markets). `hyperliquidName` is the dex's
 * `fullName` from `perpDexs`, used for dexes without a bundled deployer.
 */
export function resolveMarketDeployer(dex: string, hyperliquidName: string | undefined): MarketDeployer {
  if (dex === '') return HYPERLIQUID_DEPLOYER;
  return BUILDER_DEPLOYERS[dex] ?? { kind: 'builder', name: hyperliquidName || dex };
}
