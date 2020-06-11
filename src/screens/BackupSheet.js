import React, { useCallback, useState } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import HorizontalGestureBlocker from '../components/HorizontalGestureBlocker';
import BackupIcloudStep from '../components/backup/BackupIcloudStep';
import BackupManualStep from '../components/backup/BackupManualStep';
import BackupSheetFirstStep from '../components/backup/BackupSheetFirstStep';
import { KeyboardFixedOpenLayout } from '../components/layout';
import { Sheet } from '../components/sheet';

const additionalPadding = 118;

const BackupSheet = () => {
  const { getParam } = useNavigation();
  const [step, setStep] = useState(getParam('option', 'first'));
  const onIcloudBackup = useCallback(() => {
    setStep('icloud');
  }, []);

  const onManualBackup = useCallback(() => {
    setStep('manual');
  }, []);

  const renderStep = useCallback(() => {
    switch (step) {
      case 'icloud':
        return <BackupIcloudStep />;
      case 'manual':
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
  if (step === 'icloud') {
    return (
      <HorizontalGestureBlocker>
        <KeyboardFixedOpenLayout additionalPadding={additionalPadding}>
          {sheet}
        </KeyboardFixedOpenLayout>
      </HorizontalGestureBlocker>
    );
  }

  return sheet;
};

export default React.memo(BackupSheet);
