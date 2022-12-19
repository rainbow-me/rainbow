import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { RouteProp } from '@react-navigation/native';
import { RainbowTransaction, TransactionType } from '@/entities';
import { ethereumUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
import { BackgroundProvider, Box } from '@/design-system';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { TransactionDetailsValueAndFeeSection } from '@/screens/transaction-details/components/TransactionDetailsValueAndFeeSection';
import { TransactionDetailsHashAndActionsSection } from '@/screens/transaction-details/components/TransactionDetailsHashAndActionsSection';
import { TransactionDetailsFromToSection } from '@/screens/transaction-details/components/TransactionDetailsFromToSection';
import { StackNavigationProp } from '@react-navigation/stack';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import * as i18n from '@/languages';
import { useContacts, useUserAccounts } from '@/hooks';

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
  const [presentedToast, setPresentedToast] = useState<
    'address' | 'hash' | null
  >(null);
  const toastTimeout = useRef<NodeJS.Timeout>();

  const type = transaction.type;
  const from = transaction.from ?? undefined;
  const to = transaction.to ?? undefined;
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

  // Dynamical settings sheet height based on content height
  useEffect(() => setParams({ longFormHeight: sheetHeight }), [
    setParams,
    sheetHeight,
  ]);

  const presentToastFor = (type: 'address' | 'hash') => {
    setPresentedToast(type);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => setPresentedToast(null), 1000);
  };

  const presentAddressToast = useCallback(() => {
    presentToastFor('address');
  }, []);

  const presentHashToast = useCallback(() => {
    presentToastFor('hash');
  }, []);

  return (
    <BackgroundProvider color="surfacePrimary">
      {({ backgroundColor }) => (
        // @ts-ignore
        <SlackSheet
          contentHeight={sheetHeight}
          backgroundColor={backgroundColor}
          height={IS_ANDROID ? sheetHeight : '100%'}
          deferredHeight={IS_ANDROID}
          scrollEnaled={false}
          showsVerticalScrollIndicator={false}
        >
          <Box
            background="surfacePrimary"
            paddingHorizontal="20px"
            paddingBottom="20px"
            onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}
          >
            <TransactionDetailsFromToSection
              from={from}
              to={to}
              presentToast={presentAddressToast}
            />
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
              presentToast={presentHashToast}
            />
          </Box>
          <ToastPositionContainer>
            <Toast
              isVisible={presentedToast === 'address'}
              text={i18n.t(i18n.l.transaction_details.address_copied)}
              testID="address-copied-toast"
            />
            <Toast
              isVisible={presentedToast === 'hash'}
              text={i18n.t(i18n.l.transaction_details.hash_copied)}
              testID="address-copied-toast"
            />
          </ToastPositionContainer>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
