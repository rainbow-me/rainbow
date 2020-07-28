import { useNavigation, useRoute } from '@react-navigation/native';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, InteractionManager, Platform } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/primitives';
import { BackupSheetSection } from '../components/backup';
import BackupConfirmPasswordStep from '../components/backup/BackupConfirmPasswordStep';
import BackupIcloudStep from '../components/backup/BackupIcloudStep';
import BackupManualStep from '../components/backup/BackupManualStep';
import LoadingOverlay from '../components/modal/LoadingOverlay';
import { Sheet, SlackSheet } from '../components/sheet';
import { saveUserBackupState } from '../handlers/localstorage/globalSettings';
import BackupStateTypes from '../helpers/backupStateTypes';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import walletLoadingStates from '../helpers/walletLoadingStates';
import WalletTypes from '../helpers/walletTypes';
import { useWallets } from '../hooks';
import { fetchBackupPassword } from '../model/keychain';
import { addWalletToCloudBackup } from '../model/wallet';
import { sheetVerticalOffset } from '../navigation/effects';
import { usePortal } from '../react-native-cool-modals/Portal';
import { setIsWalletLoading, setWalletBackedUp } from '../redux/wallets';
import { deviceUtils, logger } from '../utils';

import Routes from '@rainbow-me/routes';
import { ModalContext } from 'react-native-cool-modals/NativeStackView';

const switchSheetContentTransition = (
  <Transition.Together>
    <Transition.Out durationMs={0.1} interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={150} interpolation="easeOut" />
    <Transition.In durationMs={400} interpolation="easeOut" type="fade" />
  </Transition.Together>
);

const StyledSheet = styled(SlackSheet)`
  top: 0;
  height: 100%;
  ${deviceUtils.isTallPhone ? 'padding-bottom: 50px;' : ''}
`;

const BackupSheet = ({ setAppearListener }) => {
  const { jumpToLong } = useContext(ModalContext) || {};
  const { navigate, setOptions, goBack, setParams } = useNavigation();
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const dispatch = useDispatch();
  const {
    selectedWallet,
    wallets,
    latestBackup,
    isWalletLoading,
  } = useWallets();
  const [step, setStep] = useState(params?.option || 'first');
  const walletId = params?.walletId || selectedWallet.id;
  const missingPassword = params?.missingPassword || null;
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
        setOptions({
          isShortFormEnabled: false,
          longFormHeight: 10000,
        });
        setImmediate(jumpToLong);
      } else {
        await dispatch(
          setIsWalletLoading(walletLoadingStates.BACKING_UP_WALLET)
        );
        // We have the password and we need to add it to an existing backup
        const backupFile = await addWalletToCloudBackup(
          password,
          wallets[walletId],
          latestBackup
        );
        if (backupFile) {
          await dispatch(
            setWalletBackedUp(walletId, WalletBackupTypes.cloud, backupFile)
          );
          logger.log('BackupSheet:: backup saved everywhere!');
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
      setOptions({
        isShortFormEnabled: false,
        longFormHeight: 10000,
      });
      setImmediate(jumpToLong);
    }
  }, [
    dispatch,
    goBack,
    latestBackup,
    setParams,
    walletId,
    wallets,
    jumpToLong,
    setOptions,
  ]);

  const onManualBackup = useCallback(() => {
    switchSheetContentTransitionRef.current?.animateNextTransition();
    setStep(WalletBackupTypes.manual);
    setOptions({
      isShortFormEnabled: false,
      longFormHeight: 770,
    });
    // wait for layout of sheet
    setImmediate(jumpToLong);
  }, [jumpToLong, setOptions]);

  const onIgnoreBackup = useCallback(() => {
    goBack();
  }, [goBack]);

  const onAlreadyBackedUp = useCallback(async () => {
    /// Flag all the wallets as backed up manually
    Object.keys(wallets).forEach(async walletId => {
      if (wallets[walletId].type !== WalletTypes.readOnly) {
        await dispatch(setWalletBackedUp(walletId, WalletBackupTypes.manual));
      }
    });
    await saveUserBackupState(BackupStateTypes.done);
    goBack();
  }, [dispatch, goBack, wallets]);

  const onBackupNow = useCallback(async () => {
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.SETTINGS_MODAL, {
        initialRoute: 'BackupSection',
      });
    });
  }, [goBack, navigate]);

  useEffect(() => {
    if (step === WalletBackupTypes.cloud) {
      setOptions({
        isShortFormEnabled: false,
        longFormHeight: missingPassword ? 715 : 750,
      });
      setImmediate(jumpToLong);
    } else if (step === WalletBackupTypes.manual) {
      setOptions({
        isShortFormEnabled: false,
        longFormHeight: 770,
      });
      jumpToLong && setImmediate(jumpToLong);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderStep = useCallback(() => {
    switch (step) {
      case 'existing_user':
        return (
          <BackupSheetSection
            descriptionText={`Don't risk your money! Back up your wallet in case you lose this device.`}
            onPrimaryAction={onBackupNow}
            onSecondaryAction={onAlreadyBackedUp}
            primaryLabel="Back up now"
            secondaryLabel="􀁣 Already backed up"
            titleText="Back up your wallets"
          />
        );
      case 'imported':
        return (
          <BackupSheetSection
            descriptionText={`Don't lose your wallet! Save an encrypted copy to iCloud.`}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={onIgnoreBackup}
            primaryLabel="􀙶 Back up to iCloud"
            secondaryLabel="No thanks"
            titleText="Would you like to back up?"
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
          <BackupSheetSection
            descriptionText={`Don't lose your wallet! Save an encrypted copy to iCloud.`}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={onManualBackup}
            primaryLabel="􀙶 Back up to iCloud"
            secondaryLabel="🤓 Back up manually"
            titleText="Back up your wallet"
          />
        );
    }
  }, [
    missingPassword,
    onAlreadyBackedUp,
    onBackupNow,
    onIcloudBackup,
    onIgnoreBackup,
    onManualBackup,
    setAppearListener,
    step,
  ]);

  const SheetComponent =
    Platform.OS === 'android' && step !== WalletBackupTypes.manual
      ? Sheet
      : StyledSheet;

  return (
    <SheetComponent>
      <Transitioning.View
        ref={switchSheetContentTransitionRef}
        transition={switchSheetContentTransition}
      >
        {renderStep()}
      </Transitioning.View>
    </SheetComponent>
  );
};

export default BackupSheet;
