import { describe, expect, it } from 'vitest';

import { resolveMarketDeployer } from '@/features/perps/utils/marketDeployers';

describe('resolveMarketDeployer', () => {
  it.each([
    {
      case: 'primary dex ignores a Hyperliquid name',
      dex: '',
      hyperliquidName: 'Other',
      name: 'Hyperliquid',
      kind: 'hyperliquid',
      hasLogo: false,
    },
    { case: 'bundled dex', dex: 'xyz', hyperliquidName: undefined, name: 'Trade XYZ', kind: 'builder', hasLogo: true },
    {
      case: 'bundled name wins over the Hyperliquid name',
      dex: 'io',
      hyperliquidName: 'EntropyIO',
      name: 'Entropy',
      kind: 'builder',
      hasLogo: true,
    },
    {
      case: 'unbundled dex uses the Hyperliquid name',
      dex: 'flx',
      hyperliquidName: 'Felix Exchange',
      name: 'Felix Exchange',
      kind: 'builder',
      hasLogo: false,
    },
    { case: 'unbundled dex with an empty Hyperliquid name', dex: 'flx', hyperliquidName: '', name: 'flx', kind: 'builder', hasLogo: false },
  ])('$case', ({ dex, hyperliquidName, name, kind, hasLogo }) => {
    const deployer = resolveMarketDeployer(dex, hyperliquidName);
    expect(deployer.name).toBe(name);
    expect(deployer.kind).toBe(kind);
    expect(deployer.kind === 'builder' && deployer.logo !== undefined).toBe(hasLogo);
  });
});
