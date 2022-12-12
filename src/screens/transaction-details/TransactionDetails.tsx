import * as React from 'react';
import { useEffect, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { TransactionDetailsContent } from './components/TransactionDetailsContent';
import { useRoute } from '@react-navigation/native';
import { RainbowTransaction } from '@/entities';
import { ethereumUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
import { useNavigation } from '@/navigation';
import { View } from 'react-native';
import { BackgroundProvider } from '@/design-system';

type Params = {
  transaction: RainbowTransaction;
};

export const TransactionDetails: React.FC = () => {
  const route = useRoute();
  const { setParams } = useNavigation();
  const { transaction } = route.params as Params;
  const [sheetHeight, setSheetHeight] = useState(0);

  const hash = ethereumUtils.getHash(transaction);
  const fee = transaction.fee;

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
          testID="restore-sheet"
        >
          <View
            onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}
          >
            <TransactionDetailsContent txHash={hash} fee={fee} />
          </View>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
