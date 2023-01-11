import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import {
  RainbowTransaction,
  RainbowTransactionFee,
} from '@/entities/transactions/transaction';
import { CoinIcon } from '@/components/coin-icon';
import { Box, Stack } from '@/design-system';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import * as i18n from '@/languages';
import { TransactionType } from '@/entities';
import { ethereumUtils } from '@/utils';
import { Network } from '@/helpers';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

type Props = {
  transaction: RainbowTransaction;
  fee?: RainbowTransactionFee;
  nativeCurrencyValue?: string;
  value?: string;
};

export const TransactionDetailsValueAndFeeSection: React.FC<Props> = ({
  transaction,
}) => {
  const { network, symbol, type, fee } = transaction;
  // FIXME: Doesn't fully support Layer 2 Networks yet and not all coin icons work properly.
  const coinSymbol =
    type === TransactionType.contract_interaction
      ? ethereumUtils.getNetworkNativeAsset(network ?? Network.mainnet)?.symbol
      : symbol ?? undefined;
  const mainnetCoinAddress = useSelector(
    (state: AppState) =>
      state.data.accountAssetsData?.[
        `${transaction.address}_${transaction.network}`
      ]?.mainnet_address
  );
  const coinAddress = mainnetCoinAddress ?? transaction.address ?? undefined;

  const value = transaction.balance?.display;
  const nativeCurrencyValue = transaction.native?.display;

  const feeValue = fee?.value.display ?? '';
  const feeNativeCurrencyValue = fee?.native?.display ?? '';

  if (!fee && !value) {
    return null;
  }

  return (
    <>
      <TransactionDetailsDivider />
      <Box paddingVertical="20px">
        <Stack space="20px">
          {value && (
            <DoubleLineTransactionDetailsRow
              leftComponent={
                <CoinIcon address={coinAddress} symbol={coinSymbol} />
              }
              title={i18n.t(i18n.l.transaction_details.value)}
              value={value}
              secondaryValue={nativeCurrencyValue}
            />
          )}
          {fee && (
            <DoubleLineTransactionDetailsRow
              leftComponent={
                <TransactionDetailsSymbol icon="􀵟" withBackground />
              }
              title={i18n.t(i18n.l.transaction_details.network_fee)}
              value={feeValue}
              secondaryValue={feeNativeCurrencyValue}
            />
          )}
        </Stack>
      </Box>
    </>
  );
};
