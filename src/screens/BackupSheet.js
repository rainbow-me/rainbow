import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import HorizontalGestureBlocker from '../components/HorizontalGestureBlocker';
import BackupConfirmPasswordStep from '../components/backup/BackupConfirmPasswordStep';
import BackupIcloudStep from '../components/backup/BackupIcloudStep';
import BackupImportedStep from '../components/backup/BackupImportedStep';
import BackupManualStep from '../components/backup/BackupManualStep';
import BackupSheetFirstStep from '../components/backup/BackupSheetFirstStep';
import { KeyboardFixedOpenLayout } from '../components/layout';
import { SlackSheet } from '../components/sheet';
import WalletBackupTypes from '../helpers/walletBackupTypes';

const BackupSheet = () => {
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const [step, setStep] = useState(params?.option || 'first');
  const password = params?.password || null;
  const missingPassword = params?.missingPassword || null;
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

  const sheet = <SlackSheet>{renderStep()}</SlackSheet>;
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
