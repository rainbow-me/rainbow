import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { captureMessage } from '@sentry/react-native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { InteractionManager, StatusBar } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/support' o... Remove this comment to see the full error message
import showWalletErrorAlert from '@rainbow-me/helpers/support';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import {
  useDimensions,
  useRouteExistsInNavigationState,
  useWalletCloudBackup,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

const onError = (error: any) => DelayedAlert({ title: error }, 500);

const AndroidHeight = 400;

export default function BackupSheet() {
  const { selectedWallet, isDamaged } = useWallets();
  const { height: deviceHeight } = useDimensions();
  const { goBack, navigate, setParams } = useNavigation();
  const walletCloudBackup = useWalletCloudBackup();
  const {
    params: {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'longFormHeight' does not exist on type '... Remove this comment to see the full error message
      longFormHeight = 0,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'missingPassword' does not exist on type ... Remove this comment to see the full error message
      missingPassword = null,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'step' does not exist on type '{}'.
      step = WalletBackupStepTypes.first,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletId' does not exist on type '{}'.
      walletId = selectedWallet.id,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'nativeScreen' does not exist on type '{}... Remove this comment to see the full error message
      nativeScreen = false,
    } = {},
  } = useRoute();

  const isSettingsRoute = useRouteExistsInNavigationState(
    Routes.SETTINGS_MODAL
  );

  const handleNoLatestBackup = useCallback(() => {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <BackupConfirmPasswordStep />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <BackupCloudStep />
        );
      case WalletBackupStepTypes.manual:
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <BackupManualStep />;
      default:
        return (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

  let sheetHeight =
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && !nativeScreen
      ? AndroidHeight
      : longFormHeight + getSoftMenuBarHeight();
  let wrapperHeight =
    deviceHeight +
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    (android && !nativeScreen ? AndroidHeight : longFormHeight) +
    getSoftMenuBarHeight();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  let additionalTopPadding = android && !nativeScreen;

  //If the sheet is full screen we should handle the sheet heights and padding differently
  if (
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android &&
    (step === WalletBackupStepTypes.cloud ||
      step === WalletBackupStepTypes.manual)
  ) {
    sheetHeight = deviceHeight - 40;
    additionalTopPadding = true;
  }

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column height={wrapperHeight} testID="backup-sheet">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StatusBar barStyle="light-content" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        additionalTopPadding={additionalTopPadding}
        contentHeight={sheetHeight}
      >
        {renderStep()}
      </SlackSheet>
    </Column>
  );
}
