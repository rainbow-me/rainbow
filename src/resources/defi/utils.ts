import { NativeCurrencyKey, ZerionAsset } from '@/entities';
import {
  AddysPositionsResponse,
  Borrow,
  Claimable,
  Deposit,
  NativeDisplay,
  Position,
  PositionAsset,
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
import { Network } from '@/networks/types';

export const parsePosition = (position: Position, currency: NativeCurrencyKey): RainbowPosition => {
  let totalDeposits = '0';
  const parsedDeposits = position.deposits?.map((deposit: Deposit): RainbowDeposit => {
    deposit.underlying = deposit.underlying?.map(
      (underlying: {
        asset: PositionAsset;
        quantity: string;
      }): {
        asset: PositionAsset;
        quantity: string;
        native: NativeDisplay;
      } => {
        const nativeDisplay = convertRawAmountToNativeDisplay(
          underlying.quantity,
          underlying.asset.decimals,
          underlying.asset.price?.value!,
          currency
        );
        totalDeposits = add(totalDeposits, nativeDisplay.amount);

        return {
          ...underlying,
          native: nativeDisplay,
        };
      }
    );
    return deposit as RainbowDeposit;
  });

  let totalBorrows = '0';

  const parsedBorrows = position.borrows?.map((borrow: Borrow): RainbowBorrow => {
    borrow.underlying = borrow.underlying.map(
      (underlying: {
        asset: PositionAsset;
        quantity: string;
      }): {
        asset: PositionAsset;
        quantity: string;
        native: NativeDisplay;
      } => {
        const nativeDisplay = convertRawAmountToNativeDisplay(
          underlying.quantity,
          underlying.asset.decimals,
          underlying.asset.price?.value!,
          currency
        );
        totalBorrows = add(totalBorrows, nativeDisplay.amount);

        return {
          ...underlying,
          native: nativeDisplay,
        };
      }
    );
    return borrow as RainbowBorrow;
  });

  let totalClaimables = '0';
  const parsedClaimables = position.claimables?.map((claim: Claimable): RainbowClaimable => {
    const nativeDisplay = convertRawAmountToNativeDisplay(claim.quantity, claim.asset.decimals, claim.asset.price?.value!, currency);
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
      const uniqueId = ethereumUtils.getUniqueId(asset.asset_code.toLowerCase(), asset.network);
      positionTokens.push(uniqueId);
    });
  });

  const positionsTotals = parsedPositions.reduce(
    (acc, position) => ({
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
      borrows: { amount: '0', display: '0' },
      claimables: { amount: '0', display: '0' },
      deposits: { amount: '0', display: '0' },
    }
  );

  const totalAmount = subtract(add(positionsTotals.deposits.amount, positionsTotals.claimables.amount), positionsTotals.borrows.amount);

  const totalDisplay = {
    amount: totalAmount,
    display: convertAmountToNativeDisplay(totalAmount, currency),
  };

  return {
    totals: {
      total: totalDisplay,
      ...positionsTotals,
    },
    positions: parsedPositions,
    positionTokens,
  };
};
