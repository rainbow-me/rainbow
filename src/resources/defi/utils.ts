import { NativeCurrencyKey } from '@/entities';
import {
  AddysPositionsResponse,
  Borrow,
  Claimable,
  Position,
  PositionsTotals,
  RainbowBorrow,
  RainbowClaimable,
  RainbowDeposit,
  RainbowPosition,
  RainbowPositions,
} from './types';
import { add, convertAmountToNativeDisplay, convertRawAmountToNativeDisplay, subtract } from '@/helpers/utilities';
import { maybeSignUri } from '@/handlers/imgix';
import { ethereumUtils } from '@/utils';
import { chainsIdByName } from '@/chains';

export const parsePosition = (position: Position, currency: NativeCurrencyKey): RainbowPosition => {
  let totalLocked = '0';

  let totalDeposits = '0';
  const parsedDeposits = position.deposits?.map((deposit): RainbowDeposit => {
    return {
      ...deposit,
      underlying: deposit.underlying?.map(underlying => {
        const nativeDisplay = convertRawAmountToNativeDisplay(
          underlying.quantity,
          underlying.asset.decimals,
          underlying.asset.price?.value!,
          currency
        );

        if (deposit.omit_from_total) {
          totalLocked = add(totalLocked, nativeDisplay.amount);
        }
        totalDeposits = add(totalDeposits, nativeDisplay.amount);

        return {
          ...underlying,
          native: nativeDisplay,
        };
      }),
    };
  });

  let totalBorrows = '0';

  const parsedBorrows = position.borrows?.map((borrow: Borrow): RainbowBorrow => {
    return {
      ...borrow,
      underlying: borrow.underlying.map(underlying => {
        const nativeDisplay = convertRawAmountToNativeDisplay(
          underlying.quantity,
          underlying.asset.decimals,
          underlying.asset.price?.value!,
          currency
        );

        if (borrow.omit_from_total) {
          totalLocked = subtract(totalLocked, nativeDisplay.amount);
        }

        totalBorrows = add(totalBorrows, nativeDisplay.amount);

        return {
          ...underlying,
          native: nativeDisplay,
        };
      }),
    };
  });

  let totalClaimables = '0';
  const parsedClaimables = position.claimables?.map((claim: Claimable): RainbowClaimable => {
    const nativeDisplay = convertRawAmountToNativeDisplay(claim.quantity, claim.asset.decimals, claim.asset.price?.value!, currency);

    if (claim.omit_from_total) {
      totalLocked = add(totalLocked, nativeDisplay.amount);
    }
    totalClaimables = add(totalClaimables, nativeDisplay.amount);

    return {
      asset: claim.asset,
      quantity: claim.quantity,
      native: nativeDisplay,
    };
  });

  const positionTotals: PositionsTotals = {
    totals: {
      amount: subtract(add(totalDeposits, totalClaimables), totalBorrows),
      display: convertAmountToNativeDisplay(subtract(add(totalDeposits, totalClaimables), totalBorrows), currency),
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
  };

  return {
    type: position.type,
    totals: positionTotals,
    deposits: parsedDeposits,
    borrows: parsedBorrows,
    claimables: parsedClaimables,
    // revert dapp name bs once versions are handled via backend
    dapp: {
      ...position.dapp,
      name: position.type,
      icon_url: maybeSignUri(position.dapp.icon_url) || position.dapp.icon_url,
    },
  };
};

export const parsePositions = (data: AddysPositionsResponse, currency: NativeCurrencyKey): RainbowPositions => {
  const networkAgnosticPositions = data.payload?.positions.reduce((acc: Record<string, Position>, position: Position) => {
    return {
      ...acc,
      [position.type]: {
        claimables: [...(acc?.[position.type]?.claimables || []), ...(position?.claimables || [])],
        deposits: [...(acc?.[position.type]?.deposits || []), ...(position?.deposits || [])],
        borrows: [...(acc?.[position.type]?.borrows || []), ...(position?.borrows || [])],
        dapp: position.dapp,
      },
    };
  }, {});

  const positions = Object.keys(networkAgnosticPositions).map(key => ({
    type: key,
    ...networkAgnosticPositions[key],
  }));

  const parsedPositions = positions.map(position => parsePosition(position, currency));

  const positionTokens: string[] = [];

  parsedPositions.forEach(({ deposits }) => {
    deposits.forEach(({ asset }) => {
      const uniqueId = ethereumUtils.getUniqueId(asset.asset_code.toLowerCase(), chainsIdByName[asset.network]);
      positionTokens.push(uniqueId);
    });
  });

  const positionsTotals = parsedPositions.reduce(
    (acc, position) => ({
      totalLocked: add(acc.totalLocked, position.totals.totalLocked),
      borrows: {
        amount: add(acc.borrows.amount, position.totals.borrows.amount),
        display: convertAmountToNativeDisplay(add(acc.borrows.amount, position.totals.borrows.amount), currency),
      },
      deposits: {
        amount: add(acc.deposits.amount, position.totals.deposits.amount),
        display: convertAmountToNativeDisplay(add(acc.deposits.amount, position.totals.deposits.amount), currency),
      },
      claimables: {
        amount: add(acc.claimables.amount, position.totals.claimables.amount),
        display: convertAmountToNativeDisplay(add(acc.claimables.amount, position.totals.claimables.amount), currency),
      },
    }),
    {
      totalLocked: '0',
      borrows: { amount: '0', display: '0' },
      claimables: { amount: '0', display: '0' },
      deposits: { amount: '0', display: '0' },
    }
  );

  const totalAmount = subtract(add(positionsTotals.deposits.amount, positionsTotals.claimables.amount), positionsTotals.borrows.amount);

  return {
    totals: {
      total: {
        amount: totalAmount,
        display: convertAmountToNativeDisplay(totalAmount, currency),
      },
      ...positionsTotals,
    },
    positions: parsedPositions,
    positionTokens,
  };
};
