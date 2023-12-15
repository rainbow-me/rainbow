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
import { AssetTypes, TransactionType } from '@/entities';
import { ethereumUtils } from '@/utils';
import { Network } from '@/networks/types';
import { useUserAsset } from '@/resources/assets/useUserAsset';

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
  const assetUniqueId =
    transaction.network === Network.mainnet
      ? `${transaction.address}`
      : `${transaction.address}_${transaction.network}`;
  const { data: assetData } = useUserAsset(assetUniqueId);

  const coinAddress = assetData?.address ?? transaction.address;
  const mainnetCoinAddress = assetData?.mainnet_address;
  const coinSymbol =
    type === TransactionType.contract_interaction
      ? ethereumUtils.getNetworkNativeAsset(network ?? Network.mainnet)?.symbol
      : assetData?.symbol ?? symbol ?? undefined;
  const coinType =
    assetData?.type ?? network !== Network.mainnet ? network : AssetTypes.token;

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
                <CoinIcon
                  mainnet_address={mainnetCoinAddress}
                  address={coinAddress}
                  symbol={coinSymbol}
                  type={coinType}
                />
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
