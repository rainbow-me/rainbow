import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ModalContext } from 'react-native-cool-modals/native-stack/views/NativeStackView';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/primitives';
import BackupConfirmPasswordStep from '../components/backup/BackupConfirmPasswordStep';
import BackupIcloudStep from '../components/backup/BackupIcloudStep';
import BackupImportedStep from '../components/backup/BackupImportedStep';
import BackupManualStep from '../components/backup/BackupManualStep';
import BackupSheetFirstStep from '../components/backup/BackupSheetFirstStep';
import { SlackSheet } from '../components/sheet';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import walletLoadingStates from '../helpers/walletLoadingStates';
import { useWallets } from '../hooks';
import { fetchBackupPassword } from '../model/keychain';
import { addWalletToCloudBackup } from '../model/wallet';
import { setIsWalletLoading, setWalletBackedUp } from '../redux/wallets';
import { logger } from '../utils';

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

const BackupSheet = ({ setAppearListener }) => {
  const { jumpToLong } = useContext(ModalContext);
  const { setOptions, goBack, setParams } = useNavigation();
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const dispatch = useDispatch();
  const { selectedWallet, wallets, latestBackup } = useWallets();
  const [step, setStep] = useState(params?.option || 'first');
  const wallet_id = params?.wallet_id || selectedWallet.id;
  const missingPassword = params?.missingPassword || null;
  const onIcloudBackup = useCallback(async () => {
    if (latestBackup) {
      let password = await fetchBackupPassword();
      // If we can't get the password, we need to prompt it again
      if (!password) {
        switchSheetContentTransitionRef.current?.animateNextTransition();
        setStep(WalletBackupTypes.cloud);
        setParams({
          missingPassword: true,
          option: WalletBackupTypes.cloud,
        });
        setOptions({ isShortFormEnabled: false });
        jumpToLong();
      } else {
        await dispatch(
          setIsWalletLoading(walletLoadingStates.BACKING_UP_WALLET)
        );
        // We have the password and we need to add it to an existing backup
        const backupFile = await addWalletToCloudBackup(
          password,
          wallets[wallet_id],
          latestBackup
        );
        if (backupFile) {
          await dispatch(
            setWalletBackedUp(wallet_id, WalletBackupTypes.cloud, backupFile)
          );
          logger.log(
            'onConfirmBackup:: backup saved in redux / keychain!',
            backupFile
          );

          logger.log(
            'onConfirmBackup:: backed up user data in the cloud!',
            backupFile
          );
          goBack();
          setTimeout(() => {
            Alert.alert('Your wallet has been backed up succesfully!');
          }, 1000);
        } else {
          Alert.alert('Error while trying to backup');
        }
      }
    } else {
      switchSheetContentTransitionRef.current?.animateNextTransition();
      setStep(WalletBackupTypes.cloud);
      setOptions({ isShortFormEnabled: false });
      jumpToLong();
    }
  }, [
    dispatch,
    goBack,
    latestBackup,
    setParams,
    wallet_id,
    wallets,
    jumpToLong,
    setOptions,
  ]);

  const onManualBackup = useCallback(() => {
    switchSheetContentTransitionRef.current?.animateNextTransition();
    setStep(WalletBackupTypes.manual);
    setOptions({ isShortFormEnabled: false });
    jumpToLong();
  }, [jumpToLong, setOptions]);

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
          <BackupConfirmPasswordStep setAppearListener={setAppearListener} />
        ) : (
          <BackupIcloudStep setAppearListener={setAppearListener} />
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
    setAppearListener,
    step,
  ]);

  return (
    <StyledSheet>
      <Transitioning.View
        ref={switchSheetContentTransitionRef}
        transition={switchSheetContentTransition}
      >
        {renderStep()}
      </Transitioning.View>
    </StyledSheet>
  );
};

export default BackupSheet;
