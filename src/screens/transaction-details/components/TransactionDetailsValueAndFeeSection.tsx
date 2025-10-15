import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import { RainbowTransaction } from '@/entities/transactions/transaction';
import { Box, Stack, globalColors } from '@/design-system';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import * as i18n from '@/languages';

import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { convertAmountAndPriceToNativeDisplay, convertRawAmountToBalance } from '@/helpers/utilities';
import { useTheme } from '@/theme';
import { CardSize } from '@/components/unique-token/CardSize';
import ImgixImage from '@/components/images/ImgixImage';
import { View } from 'react-native';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/state/backendNetworks/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { checkForPendingSwap } from '@/helpers/transactions';

type Props = {
  transaction: RainbowTransaction;
  nativeCurrencyValue?: string;
  value?: string;
};

export const TransactionDetailsValueAndFeeSection: React.FC<Props> = ({ transaction }) => {
  console.log(JSON.stringify(transaction, null, 2));
  const theme = useTheme();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { fee } = transaction;
  const change = transaction?.changes?.[0];
  const assetData = transaction?.changes?.[0]?.asset;

  const isPendingSwap = checkForPendingSwap(transaction);
  const isSpeedUpOrCancel = transaction.type === 'speed_up' || transaction.type === 'cancel';

  // const value = change?.value || transaction.balance?.display;
  const value = change?.value || change?.asset.balance?.display;
  const valueDisplay = value ? convertRawAmountToBalance(value || '', assetData!).display : '';
  // const valueDisplay = change?.asset?.balance?.display;
  const nativeCurrencyValue = change?.asset?.price?.value
    ? convertAmountAndPriceToNativeDisplay(change?.asset?.balance?.amount || '', change?.asset?.price?.value || '', nativeCurrency).display
    : '';
  const feeValue = fee?.value.display ?? '';
  const feeNativeCurrencyValue = fee?.native?.display ?? '';

  if ((!value && !fee) || isPendingSwap || isSpeedUpOrCancel) return null;

  return (
    <>
      <TransactionDetailsDivider />
      <Box paddingVertical="20px">
        <Stack space="20px">
          {value && (
            <DoubleLineTransactionDetailsRow
              leftComponent={
                assetData?.type === 'nft' ? (
                  <View
                    style={{
                      shadowColor: globalColors.grey100,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.02,
                      shadowRadius: 3,
                      paddingTop: 9,
                      paddingBottom: 10,
                      overflow: 'visible',
                    }}
                  >
                    <View
                      style={{
                        shadowColor: theme.colorScheme === 'dark' || !assetData.color ? globalColors.grey100 : assetData.color,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.24,
                        shadowRadius: 9,
                      }}
                    >
                      <ImgixImage
                        size={CardSize}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                        }}
                        source={{
                          uri: assetData.icon_url,
                        }}
                      />
                    </View>
                    <ChainImage showBadge={transaction.chainId !== ChainId.mainnet} chainId={transaction.chainId} badgeYPosition={10} />
                  </View>
                ) : (
                  <RainbowCoinIcon
                    icon={assetData?.icon_url}
                    chainId={assetData?.chainId || ChainId.mainnet}
                    symbol={assetData?.symbol || ''}
                    color={assetData?.colors?.primary || assetData?.colors?.fallback || undefined}
                    showBadge={false}
                  />
                )
              }
              title={i18n.t(i18n.l.transaction_details.value)}
              value={valueDisplay || ''}
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
