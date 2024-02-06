import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import {
  RainbowTransaction,
  RainbowTransactionFee,
} from '@/entities/transactions/transaction';
import { Box, Stack, globalColors } from '@/design-system';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import * as i18n from '@/languages';
import { Network } from '@/networks/types';
import { convertAmountAndPriceToNativeDisplay } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { useTheme } from '@/theme';
import FastCoinIcon from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';
import { View } from 'react-native';
import { ImgixImage } from '@/components/images';
import { CardSize } from '@/components/unique-token/CardSize';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { ETH_SYMBOL } from '@/references';

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
  const { fee } = transaction;
  const assetData = transaction?.asset;
  const change = transaction?.changes?.[0];

  const value = change?.value || transaction.balance?.display;
  console.log(' VAL: ', change?.value);
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
                        shadowColor:
                          theme.colorScheme === 'dark' || !assetData.color
                            ? globalColors.grey100
                            : assetData.color,
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
                    {transaction.network !== Network.mainnet && (
                      <ChainBadge
                        network={transaction.network}
                        badgeYPosition={10}
                      />
                    )}
                  </View>
                ) : (
                  <FastCoinIcon
                    address={assetData?.address || ETH_ADDRESS}
                    network={transaction.network}
                    mainnetAddress={assetData?.mainnet_address}
                    symbol={assetData?.symbol || ETH_SYMBOL}
                    theme={theme}
                  />
                )
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
