import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { forEach } from 'lodash';
import React, { useCallback } from 'react';
import { Alert, InteractionManager, StatusBar } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RNCloudFs from 'react-native-cloud-fs';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/backup/RestoreCloudStep' was... Remove this comment to see the full error message
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/backup/RestoreSheetFirstStep... Remove this comment to see the full error message
import RestoreSheetFirstStep from '../components/backup/RestoreSheetFirstStep';
import { Column } from '../components/layout';
import { SlackSheet } from '../components/sheet';
import {
  fetchUserDataFromCloud,
  isCloudBackupAvailable,
} from '../handlers/cloudBackup';
import { cloudPlatform } from '../utils/platform';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export default function RestoreSheet() {
  const { goBack, navigate, setParams } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const {
    params: {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'longFormHeight' does not exist on type '... Remove this comment to see the full error message
      longFormHeight = 0,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'step' does not exist on type '{}'.
      step = WalletBackupStepTypes.first,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'userData' does not exist on type '{}'.
      userData,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'backupSelected' does not exist on type '... Remove this comment to see the full error message
      backupSelected,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'fromSettings' does not exist on type '{}... Remove this comment to see the full error message
      fromSettings,
    } = {},
  } = useRoute();

  const onCloudRestore = useCallback(async () => {
    analytics.track('Tapped "Restore from cloud"');
    let proceed = false;
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    if (android) {
      const isAvailable = await isCloudBackupAvailable();
      if (isAvailable) {
        try {
          const data = await fetchUserDataFromCloud();
          forEach(data?.wallets, wallet => {
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

          logger.log(`Downloaded ${cloudPlatform} backup info`);
        } catch (e) {
          logger.log(e);
        } finally {
          if (!proceed) {
            Alert.alert(
              'No Backups found',
              "We couldn't find any backup on Google Drive. Make sure you are logged in with the right account."
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

  const onManualRestore = useCallback(() => {
    analytics.track('Tapped "Restore with a secret phrase or private key"');
    InteractionManager.runAfterInteractions(goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigate(Routes.IMPORT_SEED_PHRASE_FLOW), 50);
    });
  }, [goBack, navigate]);

  const onWatchAddress = useCallback(() => {
    analytics.track('Tapped "Watch an Ethereum Address"');
    InteractionManager.runAfterInteractions(goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigate(Routes.IMPORT_SEED_PHRASE_FLOW), 50);
    });
  }, [goBack, navigate]);

  const wrapperHeight =
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    deviceHeight + longFormHeight + (android ? getSoftMenuBarHeight() / 2 : 0);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column height={wrapperHeight}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StatusBar barStyle="light-content" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        contentHeight={longFormHeight}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        deferredHeight={android}
        testID="restore-sheet"
      >
        {step === WalletBackupStepTypes.cloud ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <RestoreCloudStep
            backupSelected={backupSelected}
            fromSettings={fromSettings}
            userData={userData}
          />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <RestoreSheetFirstStep
            onCloudRestore={onCloudRestore}
            onManualRestore={onManualRestore}
            onWatchAddress={onWatchAddress}
            userData={userData}
          />
        )}
      </SlackSheet>
    </Column>
  );
}
