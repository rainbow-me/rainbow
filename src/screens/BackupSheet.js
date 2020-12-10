import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { InteractionManager, StatusBar } from 'react-native';
import { DelayedAlert } from '../components/alerts';
import {
  BackupCloudStep,
  BackupConfirmPasswordStep,
  BackupManualStep,
  BackupSheetSection,
} from '../components/backup';
import { Column } from '../components/layout';
import { SlackSheet } from '../components/sheet';
import { cloudPlatform } from '../utils/platform';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import {
  useDimensions,
  useRouteExistsInNavigationState,
  useWalletCloudBackup,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

const onError = error => DelayedAlert({ title: error }, 500);

const AndroidHeight = 400;

export default function BackupSheet() {
  const { selectedWallet } = useWallets();
  const { height: deviceHeight } = useDimensions();
  const { goBack, navigate, setParams } = useNavigation();
  const walletCloudBackup = useWalletCloudBackup();
  const {
    params: {
      longFormHeight = 0,
      missingPassword = null,
      step = WalletBackupStepTypes.first,
      walletId = selectedWallet.id,
      nativeScreen = false,
    } = {},
  } = useRoute();

  const isSettingsRoute = useRouteExistsInNavigationState(
    Routes.SETTINGS_MODAL
  );

  const handleNoLatestBackup = useCallback(() => {
    if (android) {
      goBack();
      navigate(Routes.BACKUP_SCREEN, {
        nativeScreen: true,
        step: WalletBackupStepTypes.cloud,
      });
    } else {
      setParams({ step: WalletBackupStepTypes.cloud });
    }
  }, [goBack, navigate, setParams]);

  const handlePasswordNotFound = useCallback(() => {
    if (android) {
      goBack();
      navigate(Routes.BACKUP_SCREEN, {
        missingPassword: true,
        nativeScreen: true,
        step: WalletBackupStepTypes.cloud,
      });
    } else {
      setParams({
        missingPassword: true,
        step: WalletBackupStepTypes.cloud,
      });
    }
  }, [goBack, navigate, setParams]);

  const onSuccess = useCallback(() => {
    goBack();
    if (!isSettingsRoute) {
      DelayedAlert({ title: lang.t('cloud.backup_success') }, 1000);
    }

    // This means the user had the password saved
    // and at least an other wallet already backed up
    analytics.track('Backup Complete via BackupSheet', {
      category: 'backup',
      label: cloudPlatform,
    });
  }, [goBack, isSettingsRoute]);

  const onIcloudBackup = useCallback(() => {
    walletCloudBackup({
      handleNoLatestBackup,
      handlePasswordNotFound,
      onError,
      onSuccess,
      walletId,
    });
  }, [
    walletCloudBackup,
    walletId,
    handleNoLatestBackup,
    handlePasswordNotFound,
    onSuccess,
  ]);

  const onManualBackup = useCallback(() => {
    if (android) {
      goBack();
      navigate(Routes.BACKUP_SCREEN, {
        nativeScreen: true,
        step: WalletBackupStepTypes.manual,
      });
    } else {
      setParams({ step: WalletBackupStepTypes.manual });
    }
  }, [goBack, navigate, setParams]);

  const onBackupNow = useCallback(async () => {
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.SETTINGS_MODAL, {
        initialRoute: 'BackupSection',
      });
    });
  }, [goBack, navigate]);

  const renderStep = useCallback(() => {
    switch (step) {
      case WalletBackupStepTypes.existing_user:
        return (
          <BackupSheetSection
            descriptionText="You have wallets that have not been backed up yet. Back them up in case you lose this device."
            onPrimaryAction={onBackupNow}
            onSecondaryAction={goBack}
            primaryLabel="Back up now"
            secondaryLabel="Maybe later"
            titleText="Would you like to back up?"
            type="Existing User"
          />
        );
      case WalletBackupStepTypes.imported:
        return (
          <BackupSheetSection
            descriptionText={`Don't lose your wallet! Save an encrypted copy to ${cloudPlatform}.`}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={goBack}
            primaryLabel={`􀙶 Back up to ${cloudPlatform}`}
            secondaryButtonTestId="backup-sheet-imported-cancel-button"
            secondaryLabel="No thanks"
            titleText="Would you like to back up?"
            type="Imported Wallet"
          />
        );
      case WalletBackupStepTypes.cloud:
        return missingPassword ? (
          <BackupConfirmPasswordStep />
        ) : (
          <BackupCloudStep />
        );
      case WalletBackupStepTypes.manual:
        return <BackupManualStep />;
      default:
        return (
          <BackupSheetSection
            descriptionText={`Don't lose your wallet! Save an encrypted copy to ${cloudPlatform}.`}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={onManualBackup}
            primaryLabel={`􀙶 Back up to ${cloudPlatform}`}
            secondaryLabel="🤓 Back up manually"
            titleText="Back up your wallet"
            type="Default"
          />
        );
    }
  }, [
    goBack,
    missingPassword,
    onBackupNow,
    onIcloudBackup,
    onManualBackup,
    step,
  ]);

  let sheetHeight = android && !nativeScreen ? AndroidHeight : longFormHeight;
  let wrapperHeight =
    deviceHeight + (android && !nativeScreen ? AndroidHeight : longFormHeight);

  // This sheet is a bit taller due to an extra line of text
  if (android && step === WalletBackupStepTypes.existing_user) {
    sheetHeight += 40;
    wrapperHeight += 40;
  }

  return (
    <Column height={wrapperHeight} testID="backup-sheet">
      <StatusBar barStyle="light-content" />
      <SlackSheet
        additionalTopPadding={android && !nativeScreen}
        contentHeight={sheetHeight}
      >
        {renderStep()}
      </SlackSheet>
    </Column>
  );
}
