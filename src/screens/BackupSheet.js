import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
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
import { isDoingSomething, setWalletBackedUp } from '../redux/wallets';
import { logger } from '../utils';

const switchSheetContentTransition = (
  <Transition.Sequence>
    <Transition.Out durationMs={0.1} interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={150} interpolation="easeOut" />
    <Transition.In durationMs={400} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const BackupSheet = () => {
  const { goBack, setParams } = useNavigation();
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const dispatch = useDispatch();
  const { selectedWallet, wallets, latestBackup } = useWallets();
  const [step, setStep] = useState(params?.option || 'first');
  const wallet_id = params?.wallet_id || selectedWallet.id;
  const missingPassword = params?.missingPassword || null;
  const onIcloudBackup = useCallback(async () => {
    console.log('latestBackup?', latestBackup);
    if (latestBackup) {
      let password = await fetchBackupPassword();
      console.log('password?', password);
      // If we can't get the password, we need to prompt it again
      if (!password) {
        switchSheetContentTransitionRef.current?.animateNextTransition();
        setStep(WalletBackupTypes.cloud);
        setParams({
          missingPassword: true,
          option: WalletBackupTypes.cloud,
        });
        console.log('went to prompt password', password);
      } else {
        await dispatch(isDoingSomething(walletLoadingStates.BACKING_UP_WALLET));
        // We have the password and we need to add it to an existing backup
        logger.log('password fetched correctly', password);
        const backupFile = await addWalletToCloudBackup(
          password,
          wallets[wallet_id],
          latestBackup
        );
        if (backupFile) {
          logger.log('onConfirmBackup:: backup completed!', backupFile);
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
    }
  }, [dispatch, goBack, latestBackup, setParams, wallet_id, wallets]);

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
          <BackupIcloudStep />
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
  }, [missingPassword, onIcloudBackup, onIgnoreBackup, onManualBackup, step]);

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
