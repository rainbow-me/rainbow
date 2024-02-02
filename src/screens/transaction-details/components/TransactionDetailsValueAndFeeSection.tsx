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
import { AssetTypes } from '@/entities';
import { ethereumUtils } from '@/utils';
import { Network } from '@/networks/types';
import { useUserAsset } from '@/resources/assets/useUserAsset';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertAmountToNativeDisplay,
} from '@/helpers/utilities';
s;
import { useAccountSettings } from '@/hooks';
import { useTheme } from '@/theme';
import FastCoinIcon from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';

type Props = {
  transaction: RainbowTransaction;
  fee?: RainbowTransactionFee;
  nativeCurrencyValue?: string;
  value?: string;
};

export const TransactionDetailsValueAndFeeSection: React.FC<Props> = ({
  transaction,
}) => {
  const theme = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { network, symbol, type, fee } = transaction;
  const assetData = transaction?.asset;
  const change = transaction?.changes?.[0];

  const coinAddress = assetData?.address;
  const mainnetCoinAddress = assetData?.mainnet_address;
  const coinSymbol = assetData?.symbol ?? symbol ?? undefined;
  const coinType =
    assetData?.type ?? network !== Network.mainnet ? network : AssetTypes.token;

  const value = change?.asset?.balance?.display || transaction.balance?.display;
  const nativeCurrencyValue = convertAmountAndPriceToNativeDisplay(
    change?.asset?.balance?.amount || '',
    change?.asset?.price?.value || '',
    nativeCurrency
  ).display;
  const feeValue = fee?.value.display ?? '';
  const feeNativeCurrencyValue = fee?.native?.display ?? '';
  return (
    <>
      <TransactionDetailsDivider />
      <Box paddingVertical="20px">
        <Stack space="20px">
          {true && (
            <DoubleLineTransactionDetailsRow
              leftComponent={
                <FastCoinIcon
                  mainnetAddress={mainnetCoinAddress}
                  address={coinAddress || ''}
                  symbol={coinSymbol || ''}
                  network={network || Network.mainnet}
                  theme={theme}
                />
              }
              title={i18n.t(i18n.l.transaction_details.value)}
              value={value || ''}
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
