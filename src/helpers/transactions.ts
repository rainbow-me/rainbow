import { AssetType, NativeCurrencyKey, RainbowTransaction, TransactionStatus } from '@/entities';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertRawAmountToBalance,
  convertRawAmountToDecimalFormat,
  greaterThan,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import * as i18n from '@/languages';
import { useSuperTokenStore } from '@/screens/token-launcher/state/rainbowSuperTokenStore';
import { useMemo } from 'react';

export const calculateTimestampOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfThisMonth = () => {
  const d = new Date();
  d.setDate(0);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfThisYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const timestampsCalculation = new Date();
export const todayTimestamp = calculateTimestampOfToday();
export const yesterdayTimestamp = calculateTimestampOfYesterday();
export const thisMonthTimestamp = calculateTimestampOfThisMonth();
export const thisYearTimestamp = calculateTimestampOfThisYear();

const checkForPendingSend = (transaction: RainbowTransaction) => {
  return transaction.status === TransactionStatus.pending && transaction.type === 'send';
};

const pendingSendTypeValues = (transaction: RainbowTransaction, nativeCurrency: NativeCurrencyKey) => {
  if (transaction.asset?.type === AssetType.nft || transaction.amount == null || transaction.asset?.price?.value == null) return;
  return [
    `${transaction.amount} ${transaction.asset?.symbol}`,
    `- ${convertAmountAndPriceToNativeDisplay(transaction.amount, transaction.asset?.price?.value, nativeCurrency)?.display}`,
  ];
};

export const checkForSwap = (transaction: RainbowTransaction) => {
  return ['swap', 'wrap', 'unwrap'].includes(transaction.type);
};

export const checkForPendingSwap = (transaction: RainbowTransaction) => {
  return checkForSwap(transaction) && transaction.status === TransactionStatus.pending;
};

export const getApprovalLabel = ({ approvalAmount, asset, type }: Pick<RainbowTransaction, 'type' | 'asset' | 'approvalAmount'>) => {
  if (!approvalAmount || !asset) return;
  if (approvalAmount === 'UNLIMITED') return i18n.t(i18n.l.transactions.approvals.unlimited);
  if (type === 'revoke') return i18n.t(i18n.l.transactions.approvals.no_allowance);
  const amountDisplay = convertRawAmountToBalance(
    approvalAmount,
    { decimals: asset?.decimals, symbol: asset?.symbol },
    undefined,
    true
  )?.display;
  return amountDisplay || '';
};

const approvalTypeValues = (transaction: RainbowTransaction) => {
  const { asset, approvalAmount } = transaction;

  if (!asset || !approvalAmount) return;
  transaction.protocol;
  return [transaction.protocol || '', getApprovalLabel(transaction)];
};

const swapTypeValues = (changes: RainbowTransaction['changes'], status: RainbowTransaction['status']) => {
  const tokenIn = changes?.filter(c => c?.direction === 'in')[0];
  const tokenOut = changes?.filter(c => c?.direction === 'out')[0];

  // NOTE: For pending txns let's use the change values instead of
  // the transaction balance change since that hasn't happened yet
  if (status === TransactionStatus.pending) {
    const decimalsOut = typeof tokenOut?.asset.decimals === 'number' ? tokenOut.asset.decimals : 18;
    const decimalsIn = typeof tokenIn?.asset.decimals === 'number' ? tokenIn.asset.decimals : 18;

    const valueOut = `${handleSignificantDecimals(convertRawAmountToDecimalFormat(tokenOut?.value?.toString() || '0', decimalsOut), decimalsOut)} ${tokenOut?.asset.symbol}`;
    const valueIn = `+${handleSignificantDecimals(convertRawAmountToDecimalFormat(tokenIn?.value?.toString() || '0', decimalsIn), decimalsIn)} ${tokenIn?.asset.symbol}`;

    return [valueOut, valueIn];
  }

  if (!tokenIn?.asset.balance?.amount || !tokenOut?.asset.balance?.amount) return;

  const valueOut = `${convertAmountToBalanceDisplay(tokenOut?.asset.balance?.amount, { ...tokenOut?.asset })}`;
  const valueIn = `+${convertAmountToBalanceDisplay(tokenIn?.asset.balance?.amount, { ...tokenIn?.asset })}`;

  return [valueOut, valueIn];
};

export const activityValues = (transaction: RainbowTransaction, nativeCurrency: NativeCurrencyKey) => {
  const { changes, direction, type, status } = transaction;
  if (checkForSwap(transaction)) return swapTypeValues(changes, status);
  if (checkForPendingSend(transaction)) return pendingSendTypeValues(transaction, nativeCurrency);
  if (['approve', 'revoke'].includes(type)) return approvalTypeValues(transaction);

  const change = changes?.filter(c => c?.direction === direction && c?.asset.type !== 'nft')[0];
  let valueSymbol = direction === 'out' ? '-' : '+';

  if (type === 'send') {
    valueSymbol = '-';
  }
  if (type === 'receive') {
    valueSymbol = '+';
  }

  if (!change?.asset) return;

  const { balance } = change.asset;

  const assetValue = convertAmountToBalanceDisplay(balance?.amount || '0', change.asset);

  const nativeBalance = convertAmountAndPriceToNativeDisplay(balance?.amount || '0', change.asset.price?.value || '0', nativeCurrency);
  const assetNativeValue = greaterThan(nativeBalance.amount, '0')
    ? `${valueSymbol}${nativeBalance?.display}`
    : i18n.t(i18n.l.transactions.no_value);

  return greaterThan(nativeBalance.amount, '0') ? [`${assetValue}`, assetNativeValue] : [assetNativeValue, `${valueSymbol}${assetValue}`];
};

export const useTransactionLaunchToken = (transaction: RainbowTransaction) => {
  return useMemo(() => {
    if (transaction?.type === 'launch') {
      return useSuperTokenStore.getState().getSuperTokenByTransactionHash(transaction.hash);
    }
    return undefined;
  }, [transaction.hash, transaction.type]);
};
