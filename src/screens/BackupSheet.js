import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { ModalContext } from 'react-native-cool-modals/native-stack/views/NativeStackView';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
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

const StyledSheet = styled(SlackSheet)`
  top: 0;
  height: 100%;
`;

const BackupSheet = () => {
  const { jumpToLong } = useContext(ModalContext);
  const { setOptions, goBack } = useNavigation();
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const [step, setStep] = useState(params?.option || 'first');
  const password = params?.password || null;
  const missingPassword = params?.missingPassword || null;
  const onIcloudBackup = useCallback(() => {
    //switchSheetContentTransitionRef.current?.animateNextTransition();
    jumpToLong();
    setOptions({ isShortFormEnabled: false });
    setStep(WalletBackupTypes.cloud);
  }, [jumpToLong]);

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

  return <StyledSheet>{renderStep()}</StyledSheet>;
};

export default React.memo(BackupSheet);
