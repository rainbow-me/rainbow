import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import BackupConfirmPasswordStep from '../components/backup/BackupConfirmPasswordStep';
import BackupIcloudStep from '../components/backup/BackupIcloudStep';
import BackupImportedStep from '../components/backup/BackupImportedStep';
import BackupManualStep from '../components/backup/BackupManualStep';
import BackupSheetFirstStep from '../components/backup/BackupSheetFirstStep';
import { SlackSheet } from '../components/sheet';
import WalletBackupTypes from '../helpers/walletBackupTypes';

const switchSheetContentTransition = (
  <Transition.Sequence>
    <Transition.Out durationMs={0.1} interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={150} interpolation="easeOut" />
    <Transition.In durationMs={400} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const BackupSheet = () => {
  const { goBack } = useNavigation();
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const [step, setStep] = useState(params?.option || 'first');
  const password = params?.password || null;
  const missingPassword = params?.missingPassword || null;
  const onIcloudBackup = useCallback(() => {
    switchSheetContentTransitionRef.current?.animateNextTransition();
    setStep(WalletBackupTypes.cloud);
  }, []);

  const onManualBackup = useCallback(() => {
    switchSheetContentTransitionRef.current?.animateNextTransition();
    setStep(WalletBackupTypes.manual);
  }, []);

  const onIgnoreBackup = useCallback(() => {
    goBack();
  }, [goBack]);

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

  return (
    <SlackSheet>
      <Transitioning.View
        ref={switchSheetContentTransitionRef}
        transition={switchSheetContentTransition}
      >
        {renderStep()}
      </Transitioning.View>
    </SlackSheet>
  );
};

export default React.memo(BackupSheet);
