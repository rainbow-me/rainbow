import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import RNCloudFs from 'react-native-cloud-fs';
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
import RestoreSheetFirstStep from '../components/backup/RestoreSheetFirstStep';
import { Column } from '../components/layout';
import { SlackSheet } from '../components/sheet';
import {
  fetchUserDataFromCloud,
  isCloudBackupAvailable,
} from '@/handlers/cloudBackup';
import { cloudPlatform } from '@/utils/platform';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import logger from '@/utils/logger';
import { IS_ANDROID, IS_IOS } from '@/env';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { AddFirstWalletStep } from '@/components/backup/AddFirstWalletStep';

export function RestoreSheet() {
  const { goBack, navigate, setParams } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const {
    params: {
      step = WalletBackupStepTypes.first,
      userData,
      backupSelected,
      fromSettings,
    } = {},
  } = useRoute();

  const onCloudRestore = useCallback(async () => {
    analytics.track('Tapped "Restore from cloud"');
    let proceed = false;
    if (IS_ANDROID) {
      const isAvailable = await isCloudBackupAvailable();
      if (isAvailable) {
        try {
          const data = await fetchUserDataFromCloud();
          if (data?.wallets) {
            Object.values(data.wallets).forEach(wallet => {
              if (
                wallet.backedUp &&
                wallet.backupType === WalletBackupTypes.cloud
              ) {
                proceed = true;
              }
            });

            if (proceed) {
              setParams({ userData: data });
            }
          }

          logger.log(`Downloaded ${cloudPlatform} backup info`);
        } catch (e) {
          logger.log(e);
        } finally {
          if (!proceed) {
            Alert.alert(
              lang.t('back_up.restore_sheet.no_backups_found'),
              lang.t('back_up.restore_sheet.we_couldnt_find_google_drive')
            );
            await RNCloudFs.logout();
          }
        }
      }
    } else {
      proceed = true;
    }
    if (proceed) {
      setParams({ step: WalletBackupStepTypes.cloud });
    }
  }, [setParams]);

  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => setParams({ longFormHeight: sheetHeight }), [
    setParams,
    sheetHeight,
  ]);

  return (
    <SlackSheet
      contentHeight={sheetHeight}
      backgroundColor="#fff"
      height={IS_ANDROID ? sheetHeight : '100%'}
      deferredHeight={IS_ANDROID}
      testID="restore-sheet"
    >
      <View onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}>
        {step === WalletBackupStepTypes.cloud ? (
          <RestoreCloudStep
            backupSelected={backupSelected}
            fromSettings={fromSettings}
            userData={userData}
          />
        ) : (
          <AddFirstWalletStep
            onCloudRestore={onCloudRestore}
            userData={userData}
          />
        )}
      </View>
    </SlackSheet>
  );
}
