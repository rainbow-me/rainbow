import { useRoute } from '@react-navigation/native';
import { captureMessage } from '@sentry/react-native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
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
import { analytics } from '@/analytics';
import showWalletErrorAlert from '@/helpers/support';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import {
  useDimensions,
  useRouteExistsInNavigationState,
  useWalletCloudBackup,
  useWallets,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

const onError = error => DelayedAlert({ title: error }, 500);

const AndroidHeight = 400;

export default function BackupSheet() {
  const { selectedWallet, isDamaged } = useWallets();
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
    Routes.SETTINGS_SHEET
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
    analytics.track('Tapped "Back up to cloud"');
    if (isDamaged) {
      showWalletErrorAlert();
      captureMessage('Damaged wallet preventing cloud backup');
      goBack();
      return;
    }

    walletCloudBackup({
      handleNoLatestBackup,
      handlePasswordNotFound,
      onError,
      onSuccess,
      walletId,
    });
  }, [
    isDamaged,
    walletCloudBackup,
    handleNoLatestBackup,
    handlePasswordNotFound,
    onSuccess,
    walletId,
    goBack,
  ]);

  const onManualBackup = useCallback(() => {
    analytics.track('Tapped "Back up manually"');
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
      navigate(Routes.SETTINGS_SHEET, {
        initialRoute: 'BackupSection',
      });
    });
  }, [goBack, navigate]);

  const renderStep = useCallback(() => {
    switch (step) {
      case WalletBackupStepTypes.existing_user:
        return (
          <BackupSheetSection
            descriptionText={lang.t('modal.back_up.existing.description')}
            onPrimaryAction={onBackupNow}
            onSecondaryAction={goBack}
            primaryLabel={lang.t('modal.back_up.existing.button.now')}
            secondaryLabel={lang.t('modal.back_up.existing.button.later')}
            titleText={lang.t('modal.back_up.existing.title')}
            type="Existing User"
          />
        );
      case WalletBackupStepTypes.imported:
        return (
          // TODO: ADD CloudPlatform to back_up.description
          <BackupSheetSection
            descriptionText={lang.t('modal.back_up.imported.description', {
              cloudPlatformName: cloudPlatform,
            })}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={goBack}
            primaryLabel={`􀙶 ${lang.t('modal.back_up.imported.button.back_up', {
              cloudPlatformName: cloudPlatform,
            })}`}
            secondaryButtonTestId="backup-sheet-imported-cancel-button"
            secondaryLabel={lang.t('modal.back_up.imported.button.no_thanks')}
            titleText={lang.t('modal.back_up.imported.title')}
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
            descriptionText={lang.t('modal.back_up.default.description', {
              cloudPlatformName: cloudPlatform,
            })}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={onManualBackup}
            primaryLabel={`􀙶 ${lang.t(
              'modal.back_up.default.button.cloud_platform',
              {
                cloudPlatformName: cloudPlatform,
              }
            )}`}
            secondaryLabel={`🤓 ${lang.t(
              'modal.back_up.default.button.manual'
            )}`}
            titleText={lang.t('modal.back_up.default.title')}
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

  let sheetHeight =
    android && !nativeScreen
      ? AndroidHeight
      : longFormHeight + getSoftMenuBarHeight();
  const wrapperHeight =
    deviceHeight +
    (android && !nativeScreen ? AndroidHeight : longFormHeight) +
    getSoftMenuBarHeight();
  let additionalTopPadding = android && !nativeScreen;

  // If the sheet is full screen we should handle the sheet heights and padding differently
  if (
    android &&
    (step === WalletBackupStepTypes.cloud ||
      step === WalletBackupStepTypes.manual)
  ) {
    sheetHeight = deviceHeight - 40;
    additionalTopPadding = true;
  }

  if (android && step === WalletBackupStepTypes.existing_user) {
    // on this step we have 3 lines of text instead of 2
    sheetHeight += 26;
  }

  return (
    <Column height={wrapperHeight} testID="backup-sheet">
      <SlackSheet
        additionalTopPadding={additionalTopPadding}
        contentHeight={sheetHeight}
      >
        {renderStep()}
      </SlackSheet>
    </Column>
  );
}
