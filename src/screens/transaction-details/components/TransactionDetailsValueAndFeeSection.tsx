import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';
import { CoinIcon } from '@/components/coin-icon';
import { Box, Stack } from '@/design-system';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import * as i18n from '@/languages';

type Props = {
  coinAddress?: string;
  coinSymbol?: string;
  fee?: RainbowTransactionFee;
  nativeCurrencyValue?: string;
  value?: string;
};

export const TransactionDetailsValueAndFeeSection: React.FC<Props> = ({
  coinAddress,
  coinSymbol,
  fee,
  nativeCurrencyValue,
  value,
}) => {
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
              value={fee.value.display}
              secondaryValue={fee.native?.display ?? ''}
            />
          )}
        </Stack>
      </Box>
    </>
  );
};
