import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';
import { CoinIcon } from '@/components/coin-icon';
import { Box, Stack } from '@/design-system';
import lang from 'i18n-js';

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
    <Box paddingVertical="20px">
      <Stack space="20px">
        {value && (
          <DoubleLineTransactionDetailsRow
            leftComponent={
              // @ts-expect-error JS component
              <CoinIcon address={coinAddress} symbol={coinSymbol} />
            }
            title={'Value'}
            value={value}
            secondaryValue={nativeCurrencyValue}
          />
        )}
        {fee && (
          <DoubleLineTransactionDetailsRow
            leftComponent={<TransactionDetailsSymbol icon="􀵟" withBackground />}
            title={lang.t('transaction_details.network_fee')}
            value={fee.value.display}
            secondaryValue={fee.native?.display ?? ''}
          />
        )}
      </Stack>
    </Box>
  );
};
