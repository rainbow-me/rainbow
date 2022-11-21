import AsyncStorage from '@react-native-async-storage/async-storage';
import lang from 'i18n-js';
import React, { useCallback, useContext, useState } from 'react';
import { InteractionManager, Switch } from 'react-native';
import codePush from 'react-native-code-push';
import {
  // @ts-ignore
  HARDHAT_URL_ANDROID,
  // @ts-ignore
  HARDHAT_URL_IOS,
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
// @ts-ignore
import Restart from 'react-native-restart';
import { useDispatch } from 'react-redux';
import { defaultConfig } from '../../config/experimental';
import useAppVersion from '../../hooks/useAppVersion';
import { settingsUpdateNetwork } from '../../redux/settings';
import NetworkSection from './NetworkSection';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { deleteAllBackups } from '@/handlers/cloudBackup';
import { getProviderForNetwork, web3SetHttpProvider } from '@/handlers/web3';
import { RainbowContext } from '@/helpers/RainbowContext';
import isTestFlight from '@/helpers/isTestFlight';
import networkTypes, { Network } from '@/helpers/networkTypes';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
  useUpdateAssetOnchainBalance,
  useWallets,
} from '@/hooks';
import { ImgixImage } from '@/components/images';
import { wipeKeychain } from '@/model/keychain';
import { clearAllStorages } from '@/model/mmkv';
import { Navigation } from '@/navigation';
import { useNavigation } from '@/navigation/Navigation';
import { explorerInit } from '@/redux/explorer';
import { clearImageMetadataCache } from '@/redux/imageMetadata';
import store from '@/redux/store';
import { walletsUpdate } from '@/redux/wallets';
import { ETH_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';
import {
  removeNotificationSettingsForWallet,
  useAllNotificationSettingsFromStorage,
  addDefaultNotificationGroupSettings,
} from '@/notifications/settings';
import { IS_DEV } from '@/env';
import { SettingsLoadingIndicator } from '@/components/settings-menu/SettingsLoadingIndicator';
import { getAllNotificationSettingsFromStorage } from '@/notifications/settings/storage';

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext) as any;
  const { wallets } = useWallets();
  const {
    accountAddress,
    testnetsEnabled,
    settingsChangeTestnetsEnabled,
  } = useAccountSettings();
  const { notificationSettings } = useAllNotificationSettingsFromStorage();
  const dispatch = useDispatch();
  const updateAssetOnchainBalanceIfNeeded = useUpdateAssetOnchainBalance();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const [loadingStates, setLoadingStates] = useState({
    clearLocalStorage: false,
    clearAsyncStorage: false,
    clearMmkvStorage: false,
  });

  const onExperimentalKeyChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
      if ((defaultConfig as any)[value].needsRestart) {
        Navigation.handleAction(Routes.WALLET_SCREEN, {});
        setTimeout(Restart.Restart, 1000);
      }
    },
    [config, setConfig]
  );

  const connectToHardhat = useCallback(async () => {
    try {
      const ready = await web3SetHttpProvider(
        (ios && HARDHAT_URL_IOS) ||
          (android && HARDHAT_URL_ANDROID) ||
          'http://127.0.0.1:8545'
      );
      logger.log('connected to hardhat', ready);
    } catch (e) {
      await web3SetHttpProvider(networkTypes.mainnet);
      logger.log('error connecting to hardhat', e);
    }
    navigate(Routes.PROFILE_SCREEN);
    dispatch(explorerInit());

    if (IS_TESTING === 'true') {
      const provider = await getProviderForNetwork(Network.mainnet);
      const ethAsset = ethereumUtils.getAccountAsset(ETH_ADDRESS);
      updateAssetOnchainBalanceIfNeeded(
        ethAsset,
        accountAddress,
        Network.mainnet,
        provider,
        () => {}
      );
    }
  }, [accountAddress, dispatch, navigate, updateAssetOnchainBalanceIfNeeded]);

  const syncCodepush = useCallback(async () => {
    const isUpdate = !!(await codePush.checkForUpdate());
    if (!isUpdate) {
      Alert.alert(lang.t('developer_settings.no_update'));
    } else {
      // dismissing not to fuck up native nav structure
      navigate(Routes.PROFILE_SCREEN);
      Alert.alert(lang.t('developer_settings.installing_update'));

      const result = await codePush.sync({
        installMode: codePush.InstallMode.IMMEDIATE,
      });

      const resultString = Object.entries(codePush.SyncStatus).find(
        e => e[1] === result
      )?.[0];
      if (resultString) Alert.alert(resultString);
    }
  }, [navigate]);

  const checkAlert = useCallback(async () => {
    try {
      const request = await fetch(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest'
      );
      if (android && request.status === 500) throw new Error('failed');
      await request.json();
      Alert.alert(
        lang.t('developer_settings.status'),
        lang.t('developer_settings.not_applied')
      );
    } catch (e) {
      Alert.alert(
        lang.t('developer_settings.status'),
        lang.t('developer_settings.applied')
      );
    }
  }, []);

  const removeBackups = async () => {
    const newWallets = { ...wallets };
    Object.keys(newWallets).forEach(key => {
      delete newWallets[key].backedUp;
      delete newWallets[key].backupDate;
      delete newWallets[key].backupFile;
      delete newWallets[key].backupType;
    });

    await store.dispatch(walletsUpdate(newWallets) as any);

    // Delete all backups (debugging)
    await deleteAllBackups();

    Alert.alert(lang.t('developer_settings.backups_deleted_successfully'));
    Restart();
  };

  const clearImageCache = async () => {
    ImgixImage.clearDiskCache();
    // clearImageCache doesn't exist on ImgixImage
    // @ts-ignore
    ImgixImage.clearImageCache();
  };

  const [errorObj, setErrorObj] = useState(null as any);

  const throwRenderError = () => {
    setErrorObj({ error: 'this throws render error' });
  };

  const codePushVersion = useAppVersion()[1];

  const revertToMainnet = useCallback(async () => {
    await resetAccountState();
    await dispatch(settingsUpdateNetwork(Network.mainnet));
    InteractionManager.runAfterInteractions(async () => {
      await loadAccountData(Network.mainnet);
      initializeAccountData();
    });
  }, [dispatch, initializeAccountData, loadAccountData, resetAccountState]);

  const toggleTestnetsEnabled = useCallback(async () => {
    testnetsEnabled && revertToMainnet();
    await dispatch(settingsChangeTestnetsEnabled(!testnetsEnabled));
  }, [
    dispatch,
    revertToMainnet,
    settingsChangeTestnetsEnabled,
    testnetsEnabled,
  ]);

  const clearAllNotificationSettings = useCallback(async () => {
    // loop through notification settings and unsubscribe all wallets
    // from firebase first or we’re gonna keep getting them even after
    // clearing storage and before changing settings
    if (notificationSettings.length > 0) {
      return Promise.all(
        notificationSettings.map(wallet =>
          removeNotificationSettingsForWallet(wallet.address)
        )
      );
    }
    return Promise.resolve();
  }, [notificationSettings]);

  const clearLocalStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearLocalStorage: true }));

    await clearAllNotificationSettings();
    await AsyncStorage.clear();
    clearAllStorages();
    addDefaultNotificationGroupSettings();

    setLoadingStates(prev => ({ ...prev, clearLocalStorage: false }));
  };

  const clearAsyncStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearAsyncStorage: true }));
    await AsyncStorage.clear();
    setLoadingStates(prev => ({ ...prev, clearAsyncStorage: false }));
  };

  const clearMMKVStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearMmkvStorage: true }));

    await clearAllNotificationSettings();
    clearAllStorages();
    addDefaultNotificationGroupSettings();

    setLoadingStates(prev => ({ ...prev, clearMmkvStorage: false }));
  };

  // TODO: Remove after finishing work on APP-27
  const navigateToTransactionDetailsPlayground = () => {
    navigate('TransactionDetailsPlayground');
  };

  return (
    <MenuContainer testID="developer-settings-sheet">
      <Menu header={IS_DEV || isTestFlight ? 'Normie Settings' : ''}>
        <MenuItem
          disabled
          leftComponent={<MenuItem.TextIcon icon="🕹️" isEmoji />}
          rightComponent={
            <Switch
              onValueChange={toggleTestnetsEnabled}
              value={testnetsEnabled}
            />
          }
          size={52}
          testID="testnet-switch"
          titleComponent={
            <MenuItem.Title
              text={lang.t('developer_settings.enable_testnets')}
            />
          }
        />
        {testnetsEnabled && <NetworkSection inDevSection />}
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
          onPress={clearLocalStorage}
          size={52}
          titleComponent={
            <MenuItem.Title
              text={lang.t('developer_settings.clear_local_storage')}
            />
          }
          rightComponent={
            loadingStates.clearLocalStorage && <SettingsLoadingIndicator />
          }
        />
      </Menu>
      {(IS_DEV || isTestFlight) && (
        <>
          <Menu header="Rainbow Developer Settings">
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={clearAsyncStorage}
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_async_storage')}
                />
              }
              rightComponent={
                loadingStates.clearAsyncStorage && <SettingsLoadingIndicator />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={clearMMKVStorage}
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_mmkv_storage')}
                />
              }
              rightComponent={
                loadingStates.clearMmkvStorage && <SettingsLoadingIndicator />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="📷️" isEmoji />}
              onPress={clearImageMetadataCache}
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_image_metadata_cache')}
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="📷️" isEmoji />}
              onPress={clearImageCache}
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_image_cache')}
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💣" isEmoji />}
              onPress={wipeKeychain}
              size={52}
              testID="reset-keychain-section"
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.reset_keychain')}
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔄" isEmoji />}
              onPress={() => Restart.Restart()}
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.restart_app')}
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={throwRenderError}
              size={52}
              testID="crash-app-section"
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.crash_app_render_error')}
                />
              }
            />
            {errorObj}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗑️" isEmoji />}
              onPress={removeBackups}
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.remove_all_backups')}
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🤷" isEmoji />}
              onPress={() => AsyncStorage.removeItem('experimentalConfig')}
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.reset_experimental_config')}
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="👷" isEmoji />}
              onPress={connectToHardhat}
              size={52}
              testID="hardhat-section"
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.connect_to_hardhat')}
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🏖️" isEmoji />}
              onPress={checkAlert}
              size={52}
              testID="alert-section"
              titleComponent={
                <MenuItem.Title text={lang.t('developer_settings.alert')} />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="⏩" isEmoji />}
              onPress={syncCodepush}
              rightComponent={
                <MenuItem.Selection>{codePushVersion}</MenuItem.Selection>
              }
              size={52}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.sync_codepush')}
                />
              }
            />
            {/* TODO: Remove after finishing work on APP-27*/}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🛝" isEmoji />}
              onPress={navigateToTransactionDetailsPlayground}
              size={52}
              titleComponent={
                <MenuItem.Title text={'Transaction Details Playground'} />
              }
            />
          </Menu>
          <Menu header="Feature Flags">
            {Object.keys(config)
              .sort()
              .filter(key => (defaultConfig as any)[key]?.settings)
              .map(key => (
                <MenuItem
                  key={key}
                  onPress={() => onExperimentalKeyChange(key)}
                  rightComponent={
                    !!config[key] && <MenuItem.StatusIcon status="selected" />
                  }
                  size={52}
                  titleComponent={<MenuItem.Title text={key} />}
                />
              ))}
          </Menu>
        </>
      )}
    </MenuContainer>
  );
};

export default DevSection;
