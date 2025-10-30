import type { DApp } from '../../types/generated/common/dapp';
import type { ListPositionsResponse, PortfolioItem, PositionName, DetailType } from '../../types/generated/positions/positions';
import type { RainbowPosition, RainbowPositions, RainbowDeposit, RainbowPool, RainbowStake, RainbowBorrow } from '../../types';
import type { Asset } from '../../types/generated/common/asset';
import { createMockPositionAsset } from './assets';

// ================================ HELPERS ================================

/**
 * Calculates netTotal and overallTotal from component values
 */
function calculateTotals(components: { totalDeposits: string; totalBorrows: string; totalRewards: string; totalLocked: string }): {
  netTotal: string;
  overallTotal: string;
  totalDeposits: string;
  totalBorrows: string;
  totalRewards: string;
  totalLocked: string;
} {
  // Calculate netTotal = deposits - borrows + rewards
  const depositsFloat = parseFloat(components.totalDeposits);
  const borrowsFloat = parseFloat(components.totalBorrows);
  const rewardsFloat = parseFloat(components.totalRewards);
  const netTotal = (depositsFloat - borrowsFloat + rewardsFloat).toString();

  // Calculate overallTotal = netTotal + locked
  const lockedFloat = parseFloat(components.totalLocked);
  const overallTotal = (parseFloat(netTotal) + lockedFloat).toString();

  return {
    netTotal,
    overallTotal,
    ...components,
  };
}

// ================================ DAPP MOCKS =================================

export function createMockDapp(
  name: string,
  overrides?: Partial<{
    url: string;
    iconUrl: string;
    colors: { primary: string; fallback: string; shadow: string };
  }>
): DApp {
  return {
    name,
    url: overrides?.url ?? `https://${name}.com`,
    iconUrl: overrides?.iconUrl ?? `https://example.com/${name}.png`,
    colors: overrides?.colors ?? {
      primary: '#B6509E',
      fallback: '#B6509E',
      shadow: '#000000',
    },
  };
}

// ================================ STATS MOCKS ================================

export function createMockStats(
  canonicalProtocolName: string,
  totals: {
    totalDeposits: string;
    totalBorrows: string;
    totalRewards: string;
    totalLocked: string;
  }
) {
  const calculated = calculateTotals(totals);

  return {
    totals: calculated,
    canonicalProtocol: {
      [canonicalProtocolName]: {
        canonicalProtocolName,
        protocolIds: [canonicalProtocolName],
        totals: calculated,
        totalsByChain: {},
      },
    },
  };
}

// ============================ TOKEN LIST TYPES ===============================

export interface TokenList {
  supplyTokenList?: Array<{ amount: string; asset: Asset; assetValue: string }>;
  borrowTokenList?: Array<{ amount: string; asset: Asset; assetValue: string }>;
  rewardTokenList?: Array<{ amount: string; asset: Asset; assetValue: string }>;
}

// ===================== POSITION MOCKS (Backend Format) =======================

export function createMockPosition(options: {
  id: string;
  protocolName: string;
  canonicalProtocolName?: string;
  protocolVersion: string;
  positionName: PositionName;
  detailType: DetailType;
  assetValue: string;
  debtValue: string;
  netValue: string;
  tokens: TokenList;
  dapp?: ReturnType<typeof createMockDapp>;
  chainId?: number;
  pool?: { id: string; chainId: number };
}) {
  const dapp = options.dapp ?? createMockDapp(options.protocolName);
  const canonicalName = options.canonicalProtocolName ?? options.protocolName.toLowerCase().split(' ')[0];

  return {
    id: options.id,
    chainId: options.chainId ?? 1,
    protocolName: options.protocolName,
    canonicalProtocolName: canonicalName,
    protocolVersion: options.protocolVersion,
    tvl: '0',
    dapp,
    portfolioItems: [
      {
        name: options.positionName,
        stats: {
          assetValue: options.assetValue,
          debtValue: options.debtValue,
          netValue: options.netValue,
        },
        updateTime: undefined,
        detailTypes: [options.detailType],
        pool: options.pool,
        assetDict: {},
        detail: {
          supplyTokenList: options.tokens.supplyTokenList || [],
          borrowTokenList: options.tokens.borrowTokenList || [],
          rewardTokenList: options.tokens.rewardTokenList || [],
          tokenList: [],
        },
      },
    ],
  };
}

export function createMockResponse(
  positions: ReturnType<typeof createMockPosition>[],
  stats: ReturnType<typeof createMockStats>
): ListPositionsResponse {
  return {
    result: { positions, stats },
    errors: [],
    metadata: undefined,
  };
}

export function createMockPortfolioItem(name: PositionName, description?: string): PortfolioItem {
  return {
    name,
    detailTypes: [],
    detail: description ? { description } : undefined,
    stats: undefined,
    pool: undefined,
    assetDict: {},
    updateTime: undefined,
  };
}

// ================ RAINBOW POSITION MOCKS (Frontend Format) ===================

/**
 * Type guard to check if a stake is locked
 * Safely checks for the optional isLocked property without type assertions
 */
function isLockedStake(stake: RainbowStake): stake is RainbowStake & { isLocked: true } {
  return 'isLocked' in stake && stake.isLocked === true;
}

export function createMockRainbowPosition(type: string, overrides?: Partial<RainbowPosition>): RainbowPosition {
  // Build base position with defaults
  const base: RainbowPosition = {
    type,
    protocol: `${type}-v2`,
    protocolVersion: 'v2',
    totals: {
      total: createValueField('0'),
      totalDeposits: createValueField('0'),
      totalBorrows: createValueField('0'),
      totalRewards: createValueField('0'),
      totalLocked: createValueField('0'),
    },
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
    dapp: {
      name: type,
      url: `https://${type}.com`,
      icon_url: `https://example.com/${type}.png`,
      colors: { primary: '#B6509E', fallback: '#B6509E', shadow: '#000000' },
    },
    ...overrides,
  };

  // Calculate totals from actual items (after overrides applied)
  // Pools are included in totalDeposits since they represent deposited liquidity
  const totalDeposits = [...(base.deposits || []), ...(base.pools || [])]
    .reduce((sum, item) => sum + parseFloat(item.value.amount), 0)
    .toString();

  const totalBorrows = (base.borrows || []).reduce((sum, item) => sum + parseFloat(item.value.amount), 0).toString();

  const totalRewards = (base.rewards || []).reduce((sum, item) => sum + parseFloat(item.value.amount), 0).toString();

  const totalLocked = (base.stakes || [])
    .filter(isLockedStake)
    .reduce((sum, item) => sum + parseFloat(item.value.amount), 0)
    .toString();

  // Use calculateTotals to get derived values
  const calculated = calculateTotals({
    totalDeposits,
    totalBorrows,
    totalRewards,
    totalLocked,
  });

  // Return position with calculated totals
  return {
    ...base,
    totals: {
      total: createValueField(calculated.overallTotal),
      totalDeposits: createValueField(calculated.totalDeposits),
      totalBorrows: createValueField(calculated.totalBorrows),
      totalRewards: createValueField(calculated.totalRewards),
      totalLocked: createValueField(calculated.totalLocked),
    },
  };
}

export function createMockDeposit(symbol: string, quantity: string, value: string): RainbowDeposit {
  return {
    asset: createMockPositionAsset(symbol, 1),
    quantity,
    value: { amount: value, display: `$${value}` },
    underlying: [],
  };
}

export function createMockPool(symbol: string, quantity: string, value: string, overrides?: Partial<RainbowPool>): RainbowPool {
  return {
    asset: createMockPositionAsset(symbol, 1),
    quantity,
    value: { amount: value, display: `$${value}` },
    underlying: [],
    isConcentratedLiquidity: false,
    rangeStatus: 'in_range',
    allocation: '50/50',
    ...overrides,
  };
}

export function createMockStake(symbol: string, quantity: string, value: string, overrides?: Partial<RainbowStake>): RainbowStake {
  const base = {
    asset: createMockPositionAsset(symbol, 1),
    quantity,
    value: { amount: value, display: `$${value}` },
    underlying: [],
  };

  // If isLp is true in overrides, return an LP stake with required LP fields
  if (overrides?.isLp === true) {
    return {
      ...base,
      ...overrides,
      isLp: true,
      isConcentratedLiquidity: overrides.isConcentratedLiquidity ?? false,
      rangeStatus: overrides.rangeStatus ?? 'in_range',
      allocation: overrides.allocation ?? '50/50',
    } as RainbowStake;
  }

  // Otherwise return a regular stake
  return {
    ...base,
    ...overrides,
    isLp: false,
  } as RainbowStake;
}

export function createMockBorrow(symbol: string, quantity: string, value: string): RainbowBorrow {
  return {
    asset: createMockPositionAsset(symbol, 1),
    quantity,
    value: { amount: value, display: `$${value}` },
    underlying: [],
  };
}

// ============================ VALUE FIELD HELPERS ============================

export function createValueField(amount: string, currency = 'USD'): { amount: string; display: string } {
  return {
    amount,
    display: currency === 'USD' ? `$${amount}` : `${amount} ${currency}`,
  };
}

// =============================== DATA BUILDERS ===============================

export function createMockPositionsData(
  overrides: {
    totalLocked?: string;
    totalDeposits?: string;
    totalBorrows?: string;
    totalRewards?: string;
    positions?: Record<string, RainbowPosition>;
  } = {}
): RainbowPositions {
  const calculated = calculateTotals({
    totalDeposits: overrides.totalDeposits ?? '0',
    totalBorrows: overrides.totalBorrows ?? '0',
    totalRewards: overrides.totalRewards ?? '0',
    totalLocked: overrides.totalLocked ?? '0',
  });

  return {
    positions: overrides.positions ?? {},
    totals: {
      total: createValueField(calculated.overallTotal),
      totalLocked: createValueField(calculated.totalLocked),
      totalDeposits: createValueField(calculated.totalDeposits),
      totalBorrows: createValueField(calculated.totalBorrows),
      totalRewards: createValueField(calculated.totalRewards),
    },
  };
}

export function createSimpleDapp(name: string): DApp {
  return {
    name,
    url: `https://${name}.com`,
    iconUrl: `https://example.com/${name}.png`,
    colors: { primary: '#B6509E', fallback: '#B6509E', shadow: '#000000' },
  };
}
