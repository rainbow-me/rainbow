import { useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
import { SlackSheet } from '../components/sheet';
import { BackgroundProvider } from '@/design-system';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { useNavigation } from '@/navigation';
import { IS_ANDROID } from '@/env';
import { AddFirstWalletStep } from '@/components/backup/AddFirstWalletStep';

export function RestoreSheet() {
  const { setParams } = useNavigation();
  const {
    params: {
      step = WalletBackupStepTypes.first,
      userData,
      backupSelected,
      fromSettings,
    } = {},
  } = useRoute();

  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => setParams({ longFormHeight: sheetHeight }), [
    setParams,
    sheetHeight,
  ]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
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
            {step === WalletBackupStepTypes.cloud ? (
              <RestoreCloudStep
                backupSelected={backupSelected}
                fromSettings={fromSettings}
                userData={userData}
              />
            ) : (
              <AddFirstWalletStep userData={userData} />
            )}
          </View>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
}
