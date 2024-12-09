import { NativeCurrencyKey } from '@/entities';
import {
  AddysPositionsResponse,
  Borrow,
  Claimable,
  Deposit,
  Position,
  PositionsTotals,
  RainbowBorrow,
  RainbowClaimable,
  RainbowDeposit,
  RainbowPosition,
  RainbowPositions,
  RainbowStake,
  Stake,
  UnderlyingAsset,
} from './types';
import { add, convertAmountToNativeDisplay, convertRawAmountToNativeDisplay, lessThan, subtract } from '@/helpers/utilities';
import { maybeSignUri } from '@/handlers/imgix';
import { ethereumUtils } from '@/utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const PROTOCOL_VERSION_REGEX = /-[vV]\d+$/;
const LP_POOL_SYMBOL = 'LP-POOL';
const CONCENTRATED_LIQUIDITY_ONLY_DAPPS = ['uniswap-v3'];

// Zerion currently has no specific lp position signifier
function isLpPositionItem(item: Deposit | Stake): boolean {
  return item.asset.symbol === LP_POOL_SYMBOL;
}

function calculatePositionItemNativeDisplayValue(item: UnderlyingAsset | Claimable | Stake, currency: NativeCurrencyKey) {
  const decimals = typeof item.asset.decimals === 'number' ? item.asset.decimals : 18;
  return convertRawAmountToNativeDisplay(item.quantity, decimals, item.asset.price?.value ?? 0, currency);
}

function addPositionTotals(totals1: PositionsTotals, totals2: PositionsTotals, currency: NativeCurrencyKey): PositionsTotals {
  return {
    totals: {
      amount: add(totals1.totals.amount, totals2.totals.amount),
      display: convertAmountToNativeDisplay(add(totals1.totals.amount, totals2.totals.amount), currency),
    },
    totalLocked: add(totals1.totalLocked, totals2.totalLocked),
    borrows: {
      amount: add(totals1.borrows.amount, totals2.borrows.amount),
      display: convertAmountToNativeDisplay(add(totals1.borrows.amount, totals2.borrows.amount), currency),
    },
    claimables: {
      amount: add(totals1.claimables.amount, totals2.claimables.amount),
      display: convertAmountToNativeDisplay(add(totals1.claimables.amount, totals2.claimables.amount), currency),
    },
    deposits: {
      amount: add(totals1.deposits.amount, totals2.deposits.amount),
      display: convertAmountToNativeDisplay(add(totals1.deposits.amount, totals2.deposits.amount), currency),
    },
    stakes: {
      amount: add(totals1.stakes.amount, totals2.stakes.amount),
      display: convertAmountToNativeDisplay(add(totals1.stakes.amount, totals2.stakes.amount), currency),
    },
  };
}

/**
 * Parses a pool string to extract token symbols
 * @param {string} name - String in format "Name TOKEN1/TOKEN2 Pool (#ID)"
 * @returns {string[]} Array of token symbols
 */
function parseTokenSymbolsFromPoolName(name: string): string[] {
  try {
    const match = name.match(/\b[A-Z]+(?:\/[A-Z]+)+\b/);
    if (!match) {
      return [];
    }
    return match[0].split('/');
  } catch (error) {
    return [];
  }
}

// hack to fix for Zerion api returning only 1 asset for lp position when position is out of range
function fixOutOfRangeLpPosition(positionItem: Deposit | Stake, claimables: Claimable[]): Deposit | Stake {
  if (!positionItem.underlying) {
    return positionItem;
  }

  const lpTokenSymbols = parseTokenSymbolsFromPoolName(positionItem.asset.name);

  // we already have the correct number of underlying assets
  if (lpTokenSymbols.length === positionItem.underlying.length) {
    return positionItem;
  }

  const missingUnderlyingAssetSymbols = lpTokenSymbols.filter(
    symbol => !positionItem.underlying?.some(underlying => underlying.asset.symbol === symbol)
  );

  if (missingUnderlyingAssetSymbols.length === 0) {
    return positionItem;
  }

  const missingUnderlyingAssets = missingUnderlyingAssetSymbols.map(symbol => {
    // since each lp earns from both tokens, we can just take the first claimable that matches the symbol and network
    const claimable = claimables.find(claim => claim.asset.symbol === symbol && claim.asset.network === positionItem.asset.network);
    return {
      asset: claimable?.asset,
      quantity: '0',
    };
  });

  // could not find claimable for at least one of the missing underlying assets
  if (missingUnderlyingAssets.some(asset => !asset.asset)) {
    return positionItem;
  }

  return {
    ...positionItem,
    // cast to UnderlyingAsset[] because typescript cannot infer that there will not be any nullish asset values from the check above
    underlying: [...(positionItem.underlying ?? []), ...missingUnderlyingAssets] as UnderlyingAsset[],
  };
}

function parsePositionTotals(position: Position, currency: NativeCurrencyKey): PositionsTotals {
  let totalLocked = '0';
  let totalDeposits = '0';
  let totalBorrows = '0';
  let totalClaimables = '0';
  let totalStakes = '0';

  position.deposits.forEach(deposit => {
    deposit.underlying?.forEach(underlying => {
      const native = calculatePositionItemNativeDisplayValue(underlying, currency);

      if (deposit.omit_from_total) {
        totalLocked = add(totalLocked, native.amount);
      }

      totalDeposits = add(totalDeposits, native.amount);
    });
  });

  position.borrows.forEach(borrow => {
    borrow.underlying?.forEach(underlying => {
      const native = calculatePositionItemNativeDisplayValue(underlying, currency);

      if (borrow.omit_from_total) {
        totalLocked = subtract(totalLocked, native.amount);
      }

      totalBorrows = add(totalBorrows, native.amount);
    });
  });

  position.claimables.forEach(claim => {
    const native = calculatePositionItemNativeDisplayValue(claim, currency);

    if (claim.omit_from_total) {
      totalLocked = add(totalLocked, native.amount);
    }

    totalClaimables = add(totalClaimables, native.amount);
  });

  position.stakes.forEach(stake => {
    stake.underlying?.forEach(underlying => {
      const native = calculatePositionItemNativeDisplayValue(underlying, currency);

      if (stake.omit_from_total) {
        totalLocked = add(totalLocked, native.amount);
      }

      totalStakes = add(totalStakes, native.amount);
    });
  });

  const totalAmount = subtract(add(add(totalDeposits, totalClaimables), totalStakes), totalBorrows);

  return {
    totals: {
      amount: totalAmount,
      display: convertAmountToNativeDisplay(totalAmount, currency),
    },
    totalLocked,
    borrows: {
      amount: totalBorrows,
      display: convertAmountToNativeDisplay(totalBorrows, currency),
    },
    claimables: {
      amount: totalClaimables,
      display: convertAmountToNativeDisplay(totalClaimables, currency),
    },
    deposits: {
      amount: totalDeposits,
      display: convertAmountToNativeDisplay(totalDeposits, currency),
    },
    stakes: {
      amount: totalStakes,
      display: convertAmountToNativeDisplay(totalStakes, currency),
    },
  };
}

function parsePosition(position: Position, currency: NativeCurrencyKey): RainbowPosition {
  // check if the string ends with -v{number}
  const isDappVersioned = PROTOCOL_VERSION_REGEX.test(position.type);
  const dappVersion = isDappVersioned ? position.type.match(PROTOCOL_VERSION_REGEX)?.[0].slice(1) : undefined;

  const parsedDeposits = position.deposits?.map((deposit): RainbowDeposit => {
    let parsedDeposit = deposit;

    const isLpDeposit = isLpPositionItem(parsedDeposit);

    if (isLpDeposit) {
      parsedDeposit = fixOutOfRangeLpPosition(parsedDeposit, position.claimables);
    }

    // it's okay that this is after the lp fix because an lp deposit will always have at least one underlying asset
    // not all deposits have underlying assets, normalize to avoid conditional rendering logic
    if (!parsedDeposit.underlying) {
      parsedDeposit.underlying = [
        {
          asset: parsedDeposit.asset,
          quantity: parsedDeposit.quantity,
        },
      ];
    }

    const underlying = parsedDeposit.underlying.map(underlying => {
      return {
        ...underlying,
        native: calculatePositionItemNativeDisplayValue(underlying, currency),
      };
    });

    return {
      ...parsedDeposit,
      dappVersion,
      isLp: isLpDeposit,
      isConcentratedLiquidity: CONCENTRATED_LIQUIDITY_ONLY_DAPPS.includes(position.type),
      totalValue: underlying.reduce((acc, underlying) => add(acc, underlying.native.amount), '0'),
      underlying,
    };
  });

  const parsedStakes = position.stakes?.map((stake): RainbowStake => {
    let parsedStake = stake;

    const isLpStake = isLpPositionItem(parsedStake);

    if (isLpStake) {
      parsedStake = fixOutOfRangeLpPosition(parsedStake, position.claimables);
    }

    // not all stakes have underlying assets, normalize to avoid conditional rendering logic
    if (!parsedStake.underlying) {
      parsedStake.underlying = [
        {
          asset: parsedStake.asset,
          quantity: parsedStake.quantity,
        },
      ];
    }

    const underlying = parsedStake.underlying.map(underlying => {
      return {
        ...underlying,
        native: calculatePositionItemNativeDisplayValue(underlying, currency),
      };
    });

    return {
      ...parsedStake,
      dappVersion,
      isLp: isLpStake,
      isConcentratedLiquidity: CONCENTRATED_LIQUIDITY_ONLY_DAPPS.includes(position.type),
      totalValue: underlying.reduce((acc, underlying) => add(acc, underlying.native.amount), '0'),
      underlying,
    };
  });

  const parsedBorrows = position.borrows?.map((borrow: Borrow): RainbowBorrow => {
    // not all borrows have underlying assets, normalize to avoid conditional rendering logic
    if (!borrow.underlying) {
      borrow.underlying = [
        {
          asset: borrow.asset,
          quantity: borrow.quantity,
        },
      ];
    }

    const underlying = borrow.underlying.map(underlying => {
      return {
        ...underlying,
        dappVersion,
        native: calculatePositionItemNativeDisplayValue(underlying, currency),
      };
    });

    return {
      ...borrow,
      totalValue: underlying.reduce((acc, underlying) => add(acc, underlying.native.amount), '0'),
      underlying,
    };
  });

  const parsedClaimables = position.claimables?.map((claim: Claimable): RainbowClaimable => {
    return {
      asset: claim.asset,
      quantity: claim.quantity,
      omit_from_total: claim.omit_from_total,
      native: calculatePositionItemNativeDisplayValue(claim, currency),
      dappVersion,
    };
  });

  return {
    type: position.type,
    totals: parsePositionTotals(position, currency),
    deposits: parsedDeposits,
    borrows: parsedBorrows,
    claimables: parsedClaimables,
    stakes: parsedStakes,
    // revert dapp name bs once versions are handled via backend
    dapp: {
      ...position.dapp,
      name: position.type,
      icon_url: maybeSignUri(position.dapp.icon_url) || position.dapp.icon_url,
    },
  };
}

export function parsePositions(data: AddysPositionsResponse, currency: NativeCurrencyKey): RainbowPositions {
  const networkAgnosticPositions: Record<string, Position> = data.payload?.positions.reduce(
    (acc: Record<string, Position>, position: Position) => {
      const type = position.type;

      return {
        ...acc,
        [type]: {
          type,
          claimables: [...(acc?.[type]?.claimables || []), ...(position?.claimables || [])],
          deposits: [...(acc?.[type]?.deposits || []), ...(position?.deposits || [])],
          borrows: [...(acc?.[type]?.borrows || []), ...(position?.borrows || [])],
          stakes: [...(acc?.[type]?.stakes || []), ...(position?.stakes || [])],
          dapp: position.dapp,
        },
      };
    },
    {}
  );

  // parse positions before grouping by non-versioned dapp so version can be attached to position items
  const parsedPositions = Object.values(networkAgnosticPositions).map(position => parsePosition(position, currency));

  const versionAgnosticPositions = parsedPositions.reduce((acc: Record<string, RainbowPosition>, position: RainbowPosition) => {
    const isDappVersioned = PROTOCOL_VERSION_REGEX.test(position.type);

    const nonVersionedType = isDappVersioned ? position.type.replace(PROTOCOL_VERSION_REGEX, '') : position.type;
    const nonVersionedDappName = isDappVersioned ? position.dapp.name.replace(PROTOCOL_VERSION_REGEX, '') : position.dapp.name;

    const nonVersionedClaimables = [...(acc?.[nonVersionedType]?.claimables || []), ...(position?.claimables || [])].sort((a, b) =>
      lessThan(b.native.amount, a.native.amount) ? -1 : 1
    );
    const nonVersionedDeposits = [...(acc?.[nonVersionedType]?.deposits || []), ...(position?.deposits || [])].sort((a, b) =>
      lessThan(b.totalValue, a.totalValue) ? -1 : 1
    );
    const nonVersionedBorrows = [...(acc?.[nonVersionedType]?.borrows || []), ...(position?.borrows || [])].sort((a, b) =>
      lessThan(b.totalValue, a.totalValue) ? -1 : 1
    );
    const nonVersionedStakes = [...(acc?.[nonVersionedType]?.stakes || []), ...(position?.stakes || [])].sort((a, b) =>
      lessThan(b.totalValue, a.totalValue) ? -1 : 1
    );

    return {
      ...acc,
      [nonVersionedType]: {
        type: nonVersionedType,
        claimables: nonVersionedClaimables,
        deposits: nonVersionedDeposits,
        borrows: nonVersionedBorrows,
        stakes: nonVersionedStakes,
        dapp: {
          ...position.dapp,
          name: nonVersionedDappName,
        },
        totals: acc?.[nonVersionedType]?.totals
          ? addPositionTotals(acc?.[nonVersionedType]?.totals, position.totals, currency)
          : position.totals,
      } satisfies RainbowPosition,
    } as Record<string, RainbowPosition>;
  }, {});

  const positions = Object.values(versionAgnosticPositions);

  // these are tokens that would be represented twice if shown in the token list, such as a Sushiswap LP token
  const tokensToExcludeFromTokenList: string[] = [];
  const chainsIdByName = useBackendNetworksStore.getState().getChainsIdByName();

  positions.forEach(({ deposits }) => {
    deposits.forEach(({ asset }) => {
      if (asset.defi_position) {
        const uniqueId = ethereumUtils.getUniqueId(asset.asset_code.toLowerCase(), chainsIdByName[asset.network]);
        tokensToExcludeFromTokenList.push(uniqueId);
      }
    });
  });

  const positionsTotals = positions.reduce((acc, position) => addPositionTotals(acc, position.totals, currency), {
    totals: { amount: '0', display: '0' },
    totalLocked: '0',
    borrows: { amount: '0', display: '0' },
    deposits: { amount: '0', display: '0' },
    claimables: { amount: '0', display: '0' },
    stakes: { amount: '0', display: '0' },
  });

  return {
    totals: {
      total: {
        amount: positionsTotals.totals.amount,
        display: positionsTotals.totals.display,
      },
      ...positionsTotals,
    },
    positions,
    positionTokens: tokensToExcludeFromTokenList,
  };
}
