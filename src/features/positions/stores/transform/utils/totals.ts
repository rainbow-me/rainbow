import type { RainbowPosition, PositionsTotals, RainbowUnderlyingAsset, NativeDisplay, PositionToken } from '../../../types';
import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities';

/**
 * Calculate native display value for a position token
 */
export function calculateTokenNativeDisplay(token: PositionToken, currency: string): NativeDisplay {
  if (!token.asset) {
    return {
      amount: '0',
      display: convertAmountToNativeDisplay('0', currency as NativeCurrencyKey),
    };
  }

  const amount = token.amount || '0';
  const price = token.asset.price?.value || 0;
  const nativeValue = (parseFloat(amount) * price).toString();

  return {
    amount: nativeValue,
    display: convertAmountToNativeDisplay(nativeValue, currency as NativeCurrencyKey),
  };
}

/**
 * Calculate position totals from category data
 */
export function calculatePositionTotals(position: RainbowPosition, currency: string): void {
  let deposits = '0';
  let stakes = '0';
  let locked = '0';
  let borrows = '0';
  let rewards = '0';
  let pools = '0';

  // Sum up deposits
  position.deposits.forEach(deposit => {
    deposits = add(deposits, deposit.totalValue || '0');
  });

  // Sum up pools
  position.pools.forEach(pool => {
    pools = add(pools, pool.totalValue || '0');
  });

  // Sum up stakes (and locked stakes)
  position.stakes.forEach(stake => {
    stakes = add(stakes, stake.totalValue || '0');
    if (stake.isLocked) {
      locked = add(locked, stake.totalValue || '0');
    }
  });

  // Sum up borrows
  position.borrows.forEach(borrow => {
    borrows = add(borrows, borrow.totalValue || '0');
  });

  // Sum up rewards
  position.rewards.forEach(reward => {
    rewards = add(rewards, reward.totalValue || '0');
  });

  // Calculate category totals
  const totalDepositsValue = add(add(deposits, pools), stakes);
  const totalBorrowsValue = borrows;
  const totalRewardsValue = rewards;
  const totalLockedValue = locked;

  // Update position totals
  position.totals.totalDeposits = {
    amount: totalDepositsValue,
    display: convertAmountToNativeDisplay(totalDepositsValue, currency as NativeCurrencyKey),
  };
  position.totals.totalBorrows = {
    amount: totalBorrowsValue,
    display: convertAmountToNativeDisplay(totalBorrowsValue, currency as NativeCurrencyKey),
  };
  position.totals.totalRewards = {
    amount: totalRewardsValue,
    display: convertAmountToNativeDisplay(totalRewardsValue, currency as NativeCurrencyKey),
  };
  position.totals.totalLocked = {
    amount: totalLockedValue,
    display: convertAmountToNativeDisplay(totalLockedValue, currency as NativeCurrencyKey),
  };

  // Calculate net total: (Deposits + Rewards) - Borrows
  const assets = parseFloat(totalDepositsValue) + parseFloat(totalRewardsValue);
  const netValue = (assets - parseFloat(totalBorrowsValue)).toString();

  position.totals.total = {
    amount: netValue,
    display: convertAmountToNativeDisplay(netValue, currency as NativeCurrencyKey),
  };
}

/**
 * Calculate grand totals across all positions
 */
export function calculateGrandTotals(positions: RainbowPosition[], currency: string): PositionsTotals {
  let totalDeposits = '0';
  let totalBorrows = '0';
  let totalRewards = '0';
  let totalLocked = '0';
  let total = '0';

  positions.forEach(position => {
    totalDeposits = add(totalDeposits, position.totals.totalDeposits.amount);
    totalBorrows = add(totalBorrows, position.totals.totalBorrows.amount);
    totalRewards = add(totalRewards, position.totals.totalRewards.amount);
    totalLocked = add(totalLocked, position.totals.totalLocked.amount);
    total = add(total, position.totals.total.amount);
  });

  return {
    total: {
      amount: total,
      display: convertAmountToNativeDisplay(total, currency as NativeCurrencyKey),
    },
    totalDeposits: {
      amount: totalDeposits,
      display: convertAmountToNativeDisplay(totalDeposits, currency as NativeCurrencyKey),
    },
    totalBorrows: {
      amount: totalBorrows,
      display: convertAmountToNativeDisplay(totalBorrows, currency as NativeCurrencyKey),
    },
    totalRewards: {
      amount: totalRewards,
      display: convertAmountToNativeDisplay(totalRewards, currency as NativeCurrencyKey),
    },
    totalLocked: {
      amount: totalLocked,
      display: convertAmountToNativeDisplay(totalLocked, currency as NativeCurrencyKey),
    },
  };
}

/**
 * Calculate total value from underlying assets
 */
export function calculateTotalValue(underlying: RainbowUnderlyingAsset[]): string {
  return underlying.reduce((total, asset) => {
    return add(total, asset.native.amount || '0');
  }, '0');
}
