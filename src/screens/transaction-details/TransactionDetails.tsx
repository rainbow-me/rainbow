import * as React from 'react';
import { useEffect, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RainbowTransaction, TransactionType } from '@/entities';
import { ethereumUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
import { useNavigation } from '@/navigation';
import { BackgroundProvider, Box } from '@/design-system';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { TransactionDetailsValueAndFeeSection } from '@/screens/transaction-details/components/TransactionDetailsValueAndFeeSection';
import { TransactionDetailsHashAndActionsSection } from '@/screens/transaction-details/components/TransactionDetailsHashAndActionsSection';
import { StackNavigationProp } from '@react-navigation/stack';

type RouteParams = {
  TransactionDetails: {
    transaction: RainbowTransaction;
    longFormHeight: number;
  };
};

type Props = {
  route: RouteProp<RouteParams, 'TransactionDetails'>;
  navigation: StackNavigationProp<RouteParams, 'TransactionDetails'>;
};

export const TransactionDetails: React.FC<Props> = ({ navigation, route }) => {
  const { setParams } = navigation;
  const { transaction } = route.params;
  const [sheetHeight, setSheetHeight] = useState(0);

  const type = transaction.type;
  const hash = ethereumUtils.getHash(transaction);
  const fee = transaction.fee;
  const value = transaction.balance?.display;
  const nativeCurrencyValue = transaction.native?.display;
  const coinSymbol =
    type === TransactionType.contract_interaction
      ? 'eth'
      : transaction.symbol ?? undefined;
  const mainnetCoinAddress = useSelector(
    (state: AppState) =>
      state.data.accountAssetsData?.[
        `${transaction.address}_${transaction.network}`
      ]?.mainnet_address
  );
  const coinAddress = mainnetCoinAddress ?? transaction.address ?? undefined;

  useEffect(() => setParams({ longFormHeight: sheetHeight }), [
    setParams,
    sheetHeight,
  ]);

  return (
    <BackgroundProvider color="surfacePrimary">
      {({ backgroundColor }) => (
        // @ts-ignore
        <SlackSheet
          contentHeight={sheetHeight}
          backgroundColor={backgroundColor}
          height={IS_ANDROID ? sheetHeight : '100%'}
          deferredHeight={IS_ANDROID}
        >
          <Box
            background="surfacePrimary"
            paddingHorizontal="20px"
            paddingBottom="20px"
            onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}
          >
            <TransactionDetailsValueAndFeeSection
              coinAddress={coinAddress}
              coinSymbol={coinSymbol}
              fee={fee}
              nativeCurrencyValue={nativeCurrencyValue}
              value={value}
            />
            <TransactionDetailsHashAndActionsSection
              hash={hash}
              network={transaction.network}
            />
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
