import React, { useCallback, useState } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import HorizontalGestureBlocker from '../components/HorizontalGestureBlocker';
import BackupIcloudStep from '../components/backup/BackupIcloudStep';
import BackupManualStep from '../components/backup/BackupManualStep';
import BackupSheetFirstStep from '../components/backup/BackupSheetFirstStep';
import { KeyboardFixedOpenLayout } from '../components/layout';
import { Sheet } from '../components/sheet';
import WalletBackupTypes from '../helpers/walletBackupTypes';

const BackupSheet = () => {
  const { getParam } = useNavigation();
  const [step, setStep] = useState(getParam('option', 'first'));
  const onIcloudBackup = useCallback(() => {
    setStep(WalletBackupTypes.cloud);
  }, []);

  const onManualBackup = useCallback(() => {
    setStep(WalletBackupTypes.manual);
  }, []);

  const nativeStackAdditionalPadding = 0;

  const renderStep = useCallback(() => {
    switch (step) {
      case WalletBackupTypes.cloud:
        return <BackupIcloudStep />;
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
  }, [onIcloudBackup, onManualBackup, step]);

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
