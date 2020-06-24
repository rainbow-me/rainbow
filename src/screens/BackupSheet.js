import React, { useCallback, useState } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import HorizontalGestureBlocker from '../components/HorizontalGestureBlocker';
import BackupConfirmPasswordStep from '../components/backup/BackupConfirmPasswordStep';
import BackupIcloudStep from '../components/backup/BackupIcloudStep';
import BackupImportedStep from '../components/backup/BackupImportedStep';
import BackupManualStep from '../components/backup/BackupManualStep';
import BackupSheetFirstStep from '../components/backup/BackupSheetFirstStep';
import { KeyboardFixedOpenLayout } from '../components/layout';
import { Sheet } from '../components/sheet';
import WalletBackupTypes from '../helpers/walletBackupTypes';

const BackupSheet = () => {
  const { getParam, goBack } = useNavigation();
  const [step, setStep] = useState(getParam('option', 'first'));
  const password = getParam('password', null);
  const missingPassword = getParam('missingPassword', null);
  const onIcloudBackup = useCallback(() => {
    setStep(WalletBackupTypes.cloud);
  }, []);

  const onManualBackup = useCallback(() => {
    setStep(WalletBackupTypes.manual);
  }, []);

  const onIgnoreBackup = useCallback(() => {
    goBack();
  }, [goBack]);

  const nativeStackAdditionalPadding = 75;

  const renderStep = useCallback(() => {
    switch (step) {
      case 'imported':
        return (
          <BackupImportedStep
            onIcloudBackup={onIcloudBackup}
            onIgnoreBackup={onIgnoreBackup}
          />
        );
      case WalletBackupTypes.cloud:
        return missingPassword ? (
          <BackupConfirmPasswordStep />
        ) : (
          <BackupIcloudStep password={password} />
        );
      case WalletBackupTypes.manual:
        return <BackupManualStep />;
      default:
        return (
          <BackupSheetFirstStep
            onIcloudBackup={onIcloudBackup}
            onManualBackup={onManualBackup}
          />
        );
    }
  }, [
    missingPassword,
    onIcloudBackup,
    onIgnoreBackup,
    onManualBackup,
    password,
    step,
  ]);

  const sheet = <Sheet>{renderStep()}</Sheet>;
  if (step === WalletBackupTypes.cloud) {
    return (
      <HorizontalGestureBlocker>
        <KeyboardFixedOpenLayout
          additionalPadding={nativeStackAdditionalPadding}
        >
          {sheet}
        </KeyboardFixedOpenLayout>
      </HorizontalGestureBlocker>
    );
  }

  return sheet;
};

export default React.memo(BackupSheet);
