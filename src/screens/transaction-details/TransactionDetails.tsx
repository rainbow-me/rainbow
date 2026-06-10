import React, { useCallback, useEffect, useState } from 'react';
import { Platform, type LayoutChangeEvent } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { rainbowToastsActions } from '@/components/rainbow-toast/useRainbowToastsStore';
import { SlackSheet } from '@/components/sheet';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { BackgroundProvider, Box } from '@/design-system';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { TransactionDetailsFromToSection } from '@/screens/transaction-details/components/TransactionDetailsFromToSection';
import { TransactionDetailsHashAndActionsSection } from '@/screens/transaction-details/components/TransactionDetailsHashAndActionsSection';
import { TransactionDetailsStatusActionsAndTimestampSection } from '@/screens/transaction-details/components/TransactionDetailsStatusActionsAndTimestampSection';
import { TransactionDetailsValueAndFeeSection } from '@/screens/transaction-details/components/TransactionDetailsValueAndFeeSection';
import { useTransactionDetailsToasts } from '@/screens/transaction-details/hooks/useTransactionDetailsToasts';

export const TransactionDetails = () => {
  const {
    params: { transaction },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.TRANSACTION_DETAILS>>();
  const { setParams } = useNavigation<typeof Routes.TRANSACTION_DETAILS>();

  const [sheetHeight, setSheetHeight] = useState(0);
  const [statusIconHidden, setStatusIconHidden] = useState(false);
  const { presentedToast, presentToastFor } = useTransactionDetailsToasts();
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    rainbowToastsActions.setIsShowingTransactionDetails(true);
    return () => {
      rainbowToastsActions.setIsShowingTransactionDetails(false);
    };
  }, []);

  // Dynamic sheet height based on content height
  useEffect(() => setParams({ longFormHeight: sheetHeight }), [setParams, sheetHeight]);

  const onSheetContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const contentHeight = event.nativeEvent.layout.height;
      if (contentHeight > deviceHeight) setStatusIconHidden(true);
      setSheetHeight(contentHeight + (Platform.OS === 'android' ? insets.bottom : 0));
    },
    [deviceHeight, insets.bottom]
  );

  const presentAddressToast = useCallback(() => {
    presentToastFor('address');
  }, [presentToastFor]);

  const presentHashToast = useCallback(() => {
    presentToastFor('hash');
  }, [presentToastFor]);

  const presentLinkToast = useCallback(() => {
    presentToastFor('link');
  }, [presentToastFor]);

  return (
    <BackgroundProvider color="surfacePrimaryElevated">
      {({ backgroundColor }) => (
        <SlackSheet
          contentHeight={sheetHeight}
          backgroundColor={backgroundColor}
          height={Platform.OS === 'android' ? sheetHeight : '100%'}
          deferredHeight={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
        >
          <Box paddingHorizontal="20px" paddingBottom="20px" onLayout={onSheetContentLayout}>
            <TransactionDetailsStatusActionsAndTimestampSection hideIcon={statusIconHidden} transaction={transaction} />
            <TransactionDetailsFromToSection transaction={transaction} presentToast={presentAddressToast} />
            <TransactionDetailsValueAndFeeSection transaction={transaction} />
            <TransactionDetailsHashAndActionsSection
              transaction={transaction}
              presentHashToast={presentHashToast}
              presentLinkToast={presentLinkToast}
            />
          </Box>
          <ToastPositionContainer>
            <Toast
              isVisible={presentedToast === 'address'}
              text={i18n.t(i18n.l.transaction_details.address_copied)}
              testID="address-copied-toast"
            />
            <Toast isVisible={presentedToast === 'hash'} text={i18n.t(i18n.l.transaction_details.hash_copied)} testID="hash-copied-toast" />
            <Toast isVisible={presentedToast === 'link'} text={i18n.t(i18n.l.transaction_details.link_copied)} testID="link-copied-toast" />
          </ToastPositionContainer>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
