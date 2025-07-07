import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlackSheet } from '@/components/sheet';
import { RouteProp, useRoute } from '@react-navigation/native';
import { IS_ANDROID } from '@/env';
import { BackgroundProvider, Box } from '@/design-system';
import { TransactionDetailsValueAndFeeSection } from '@/screens/transaction-details/components/TransactionDetailsValueAndFeeSection';
import { TransactionDetailsHashAndActionsSection } from '@/screens/transaction-details/components/TransactionDetailsHashAndActionsSection';
import { TransactionDetailsFromToSection } from '@/screens/transaction-details/components/TransactionDetailsFromToSection';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import * as i18n from '@/languages';
import { TransactionDetailsStatusActionsAndTimestampSection } from '@/screens/transaction-details/components/TransactionDetailsStatusActionsAndTimestampSection';
import { useTransactionDetailsToasts } from '@/screens/transaction-details/hooks/useTransactionDetailsToasts';
import { RootStackParamList } from '@/navigation/types';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

export const TransactionDetails = () => {
  const {
    params: { transaction },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.TRANSACTION_DETAILS>>();
  const { setParams } = useNavigation<typeof Routes.TRANSACTION_DETAILS>();

  const [sheetHeight, setSheetHeight] = useState(0);
  const [statusIconHidden, setStatusIconHidden] = useState(false);
  const { presentedToast, presentToastFor } = useTransactionDetailsToasts();
  const { bottom } = useSafeAreaInsets();

  // Dynamic sheet height based on content height
  useEffect(() => setParams({ longFormHeight: sheetHeight }), [setParams, sheetHeight]);

  const onSheetContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const contentHeight = event.nativeEvent.layout.height;
      if (contentHeight > DEVICE_HEIGHT) setStatusIconHidden(true);
      setSheetHeight(contentHeight + (IS_ANDROID ? bottom : 0));
    },
    [bottom]
  );

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
