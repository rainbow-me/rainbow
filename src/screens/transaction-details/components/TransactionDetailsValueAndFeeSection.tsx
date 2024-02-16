import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import { RainbowTransaction, RainbowTransactionFee } from '@/entities/transactions/transaction';
import { Box, Stack } from '@/design-system';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import * as i18n from '@/languages';

import { Network } from '@/networks/types';
import { useUserAsset } from '@/resources/assets/useUserAsset';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useTheme } from '@/theme';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';

type Props = {
  transaction: RainbowTransaction;
  fee?: RainbowTransactionFee;
  nativeCurrencyValue?: string;
  value?: string;
};

export const TransactionDetailsValueAndFeeSection: React.FC<Props> = ({ transaction }) => {
  const theme = useTheme();
  const { network, fee } = transaction;
  const assetUniqueId = getUniqueId(transaction?.address || '', transaction?.network || Network.mainnet);
  const { data: assetData } = useUserAsset(assetUniqueId);

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
                <RainbowCoinIcon
                  size={40}
                  icon={assetData?.icon_url}
                  network={network || assetData?.network || Network.mainnet}
                  symbol={assetData?.symbol || ''}
                  theme={theme}
                  colors={assetData?.colors}
                />
              }
              title={i18n.t(i18n.l.transaction_details.value)}
              value={value}
              secondaryValue={nativeCurrencyValue}
            />
          )}
          {fee && (
            <DoubleLineTransactionDetailsRow
              leftComponent={<TransactionDetailsSymbol icon="􀵟" withBackground />}
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
