import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager, Platform, StatusBar } from 'react-native';
import { DelayedAlert } from '../components/alerts';
import {
  BackupConfirmPasswordStep,
  BackupIcloudStep,
  BackupManualStep,
  BackupSheetSection,
} from '../components/backup';
import { Column } from '../components/layout';
import { LoadingOverlay } from '../components/modal';
import { Sheet, SlackSheet } from '../components/sheet';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useDimensions,
  useRouteExistsInNavigationState,
  useWalletCloudBackup,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
import Routes from '@rainbow-me/routes';
import { usePortal } from 'react-native-cool-modals/Portal';

const onError = error => DelayedAlert({ title: error }, 500);

export default function BackupSheet() {
  const { isWalletLoading, selectedWallet, wallets } = useWallets();
  const { height: deviceHeight } = useDimensions();
  const { goBack, navigate, setParams } = useNavigation();
  const walletCloudBackup = useWalletCloudBackup();
  const {
    params: {
      longFormHeight = 0,
      missingPassword = null,
      step = WalletBackupStepTypes.first,
      walletId = selectedWallet.id,
    } = {},
  } = useRoute();

  const isSettingsRoute = useRouteExistsInNavigationState(
    Routes.SETTINGS_MODAL
  );

  const backupableWalletsCount = useMemo(() => {
    return Object.keys(wallets).filter(id => {
      return wallets[id].type !== WalletTypes.readOnly;
    }).length;
  }, [wallets]);

  const { setComponent, hide } = usePortal();
  useEffect(() => {
    if (isWalletLoading) {
      setComponent(
        <LoadingOverlay
          paddingTop={sheetVerticalOffset}
          title={isWalletLoading}
        />,
        false
      );
    }
    return hide;
  }, [hide, isWalletLoading, setComponent]);

  const handleNoLatestBackup = useCallback(
    () => setParams({ step: WalletBackupStepTypes.cloud }),
    [setParams]
  );

  const handlePasswordNotFound = useCallback(() => {
    setParams({
      missingPassword: true,
      step: WalletBackupStepTypes.cloud,
    });
  }, [setParams]);

  const onSuccess = useCallback(() => {
    goBack();
    if (!isSettingsRoute) {
      DelayedAlert({ title: lang.t('icloud.backup_success') }, 1000);
    }

    // This means the user had the password saved
    // and at least an other wallet already backed up
    analytics.track('Backup Complete via BackupSheet', {
      category: 'backup',
      label: 'icloud',
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

  const onManualBackup = useCallback(
    () => setParams({ step: WalletBackupStepTypes.manual }),
    [setParams]
  );

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
            descriptionText={lang.t('modal.back_up.imported_description')}
            onPrimaryAction={onBackupNow}
            onSecondaryAction={goBack}
            primaryLabel={lang.t('modal.back_up.button.now')}
            secondaryLabel={lang.t('modal.back_up.button.later')}
            titleText={
              backupableWalletsCount > 1
                ? lang.t('modal.back_up.label_plural')
                : lang.t('modal.back_up.label')
            }
            type="Existing User"
          />
        );
      case WalletBackupStepTypes.imported:
        return (
          <BackupSheetSection
            descriptionText={lang.t('modal.back_up.description')}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={goBack}
            primaryLabel={`􀙶 ${lang.t('modal.back_up.button.cloud')} iCloud`}
            secondaryButtonTestId="backup-sheet-imported-cancel-button"
            secondaryLabel={lang.t('button.no_thanks')}
            titleText={lang.t('modal_back_up.imported_title')}
            type="Imported Wallet"
          />
        );
      case WalletBackupStepTypes.cloud:
        return missingPassword ? (
          <BackupConfirmPasswordStep />
        ) : (
          <BackupIcloudStep />
        );
      case WalletBackupStepTypes.manual:
        return <BackupManualStep />;
      default:
        return (
          <BackupSheetSection
            descriptionText={lang.t('modal.back_up.description')}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={onManualBackup}
            primaryLabel={`􀙶 ${lang.t('modal.back_up.button.cloud')} iCloud`}
            secondaryLabel={`🤓 ${lang.t('modal.back_up.button.manual')}`}
            titleText={lang.t('modal.back_up.label')}
            type="Default"
          />
        );
    }
  }, [
    goBack,
    missingPassword,
    backupableWalletsCount,
    onBackupNow,
    onIcloudBackup,
    onManualBackup,
    step,
  ]);

  const SheetComponent =
    Platform.OS === 'android' && step !== WalletBackupStepTypes.manual
      ? Sheet
      : SlackSheet;

  return (
    <Column height={deviceHeight + longFormHeight} testID="backup-sheet">
      <StatusBar barStyle="light-content" />
      <SheetComponent contentHeight={longFormHeight}>
        {renderStep()}
      </SheetComponent>
    </Column>
  );
}
