import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RainbowTransaction } from '@/entities';
import { IS_ANDROID } from '@/env';
import { BackgroundProvider, Box } from '@/design-system';
import { TransactionDetailsValueAndFeeSection } from '@/screens/transaction-details/components/TransactionDetailsValueAndFeeSection';
import { TransactionDetailsHashAndActionsSection } from '@/screens/transaction-details/components/TransactionDetailsHashAndActionsSection';
import { TransactionDetailsFromToSection } from '@/screens/transaction-details/components/TransactionDetailsFromToSection';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import * as i18n from '@/languages';
import { TransactionDetailsStatusActionsAndTimestampSection } from '@/screens/transaction-details/components/TransactionDetailsStatusActionsAndTimestampSection';
import { useTransactionDetailsToasts } from '@/screens/transaction-details/hooks/useTransactionDetailsToasts';
import { LayoutChangeEvent } from 'react-native';
import { useDimensions } from '@/hooks';

type RouteParams = {
  TransactionDetails: {
    transaction: RainbowTransaction;
    longFormHeight: number;
  };
};

export const TransactionDetails = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'TransactionDetails'>>();
  const { setParams } = navigation;
  const { transaction } = route.params;

  const [sheetHeight, setSheetHeight] = useState(0);
  const [statusIconHidden, setStatusIconHidden] = useState(false);
  const { presentedToast, presentToastFor } = useTransactionDetailsToasts();
  const { height: deviceHeight } = useDimensions();

  // Dynamic sheet height based on content height
  useEffect(() => setParams({ longFormHeight: sheetHeight }), [setParams, sheetHeight]);

  const onSheetContentLayout = (event: LayoutChangeEvent) => {
    const contentHeight = event.nativeEvent.layout.height;
    if (contentHeight > deviceHeight) {
      setStatusIconHidden(true);
    }
    setSheetHeight(contentHeight);
  };

  const presentAddressToast = useCallback(() => {
    presentToastFor('address');
  }, [presentToastFor]);

  const presentHashToast = useCallback(() => {
    presentToastFor('hash');
  }, [presentToastFor]);

  return (
    <BackgroundProvider color="surfacePrimaryElevated">
      {({ backgroundColor }) => (
        <SlackSheet
          contentHeight={sheetHeight}
          backgroundColor={backgroundColor}
          height={IS_ANDROID ? sheetHeight : '100%'}
          deferredHeight={IS_ANDROID}
          showsVerticalScrollIndicator={false}
        >
          <Box paddingHorizontal="20px" paddingBottom="20px" onLayout={onSheetContentLayout}>
            <TransactionDetailsStatusActionsAndTimestampSection hideIcon={statusIconHidden} transaction={transaction} />
            <TransactionDetailsFromToSection transaction={transaction} presentToast={presentAddressToast} />
            <TransactionDetailsValueAndFeeSection transaction={transaction} />
            <TransactionDetailsHashAndActionsSection transaction={transaction} presentToast={presentHashToast} />
          </Box>
          <ToastPositionContainer>
            <Toast
              isVisible={presentedToast === 'address'}
              text={i18n.t(i18n.l.transaction_details.address_copied)}
              testID="address-copied-toast"
            />
            <Toast isVisible={presentedToast === 'hash'} text={i18n.t(i18n.l.transaction_details.hash_copied)} testID="hash-copied-toast" />
          </ToastPositionContainer>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
