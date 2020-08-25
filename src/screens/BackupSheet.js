import {
  useNavigation,
  useNavigationState,
  useRoute,
} from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
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
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';
import { useWalletCloudBackup, useWallets } from '../hooks';
import { sheetVerticalOffset } from '../navigation/effects';
import { usePortal } from '../react-native-cool-modals/Portal';
import { setAllWalletsBackedUpManually } from '../redux/wallets';
import { deviceUtils } from '../utils';

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

const BackupSheet = () => {
  const { jumpToLong } = useContext(ModalContext) || {};
  const { navigate, setOptions, goBack, setParams } = useNavigation();
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const dispatch = useDispatch();
  const { selectedWallet, isWalletLoading, wallets } = useWallets();
  const backupableWalletsCount = wallets.filter(
    wallet => wallet.type !== WalletTypes.readOnly
  ).length;
  const walletCloudBackup = useWalletCloudBackup();
  const [step, setStep] = useState(params?.option || 'first');
  const walletId = params?.walletId || selectedWallet.id;
  const missingPassword = params?.missingPassword || null;
  const { setComponent, hide } = usePortal();
  const routes = useNavigationState(state => state.routes);

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

  const handleNoLatestBackup = useCallback(() => {
    switchSheetContentTransitionRef.current?.animateNextTransition();
    setStep(WalletBackupTypes.cloud);
    setOptions({
      isShortFormEnabled: false,
      longFormHeight: 10000,
    });
    setImmediate(jumpToLong);
  }, [jumpToLong, setOptions]);

  const handlePasswordNotFound = useCallback(() => {
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
  }, [jumpToLong, setParams, setOptions]);

  const onSuccess = useCallback(() => {
    goBack();
    if (!routes.find(route => route.name === Routes.SETTINGS_MODAL)) {
      setTimeout(() => {
        Alert.alert(lang.t('icloud.backup_success'));
      }, 1000);
    }
    // This means the user had the password saved
    // and at least an other wallet already backed up
    analytics.track('Backup Complete via BackupSheet', {
      category: 'backup',
      label: 'icloud',
    });
  }, [goBack, routes]);

  const onIcloudBackup = useCallback(() => {
    walletCloudBackup({
      handleNoLatestBackup,
      handlePasswordNotFound,
      onSuccess,
      walletId,
    });
  }, [
    walletCloudBackup,
    walletId,
    handleNoLatestBackup,
    handlePasswordNotFound,
    onSuccess,
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
    await dispatch(setAllWalletsBackedUpManually());
    goBack();
  }, [dispatch, goBack]);

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
            titleText={`Back up your wallet${
              backupableWalletsCount > 1 ? 's' : ''
            }`}
            type="Existing User"
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
            type="Imported Wallet"
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
          <BackupSheetSection
            descriptionText={`Don't lose your wallet! Save an encrypted copy to iCloud.`}
            onPrimaryAction={onIcloudBackup}
            onSecondaryAction={onManualBackup}
            primaryLabel="􀙶 Back up to iCloud"
            secondaryLabel="🤓 Back up manually"
            titleText="Back up your wallet"
            type="Default"
          />
        );
    }
  }, [
    missingPassword,
    backupableWalletsCount,
    onAlreadyBackedUp,
    onBackupNow,
    onIcloudBackup,
    onIgnoreBackup,
    onManualBackup,
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
