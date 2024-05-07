import AsyncStorage from '@react-native-async-storage/async-storage';
import lang from 'i18n-js';
import React, { useCallback, useContext, useState } from 'react';
import {
  // @ts-ignore
  HARDHAT_URL_ANDROID,
  // @ts-ignore
  HARDHAT_URL_IOS,
} from 'react-native-dotenv';
// @ts-ignore
import Restart from 'react-native-restart';
import { useDispatch } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { deleteAllBackups } from '@/handlers/cloudBackup';
import { web3SetHttpProvider } from '@/handlers/web3';
import { RainbowContext } from '@/helpers/RainbowContext';
import isTestFlight from '@/helpers/isTestFlight';
import networkTypes from '@/helpers/networkTypes';
import { useWallets } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { wipeKeychain } from '@/model/keychain';
import { clearAllStorages } from '@/model/mmkv';
import { Navigation } from '@/navigation';
import { useNavigation } from '@/navigation/Navigation';
import { explorerInit } from '@/redux/explorer';
import { clearImageMetadataCache } from '@/redux/imageMetadata';
import store from '@/redux/store';
import { walletsUpdate } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import logger from 'logger';
import {
  removeNotificationSettingsForWallet,
  useAllNotificationSettingsFromStorage,
  addDefaultNotificationGroupSettings,
} from '@/notifications/settings';
import { IS_DEV } from '@/env';
import { getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded } from '@/helpers/signingWallet';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import { defaultConfig, getExperimetalFlag, LOG_PUSH } from '@/config';
import { serialize } from '@/logger/logDump';
import { isAuthenticated } from '@/utils/authentication';

import { getFCMToken } from '@/notifications/tokens';
import { removeGlobalNotificationSettings } from '@/notifications/settings/settings';
import { nonceStore } from '@/state/nonces';
import { pendingTransactionsStore } from '@/state/pendingTransactions';

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext) as any;
  const { wallets } = useWallets();
  const { walletNotificationSettings } = useAllNotificationSettingsFromStorage();
  const dispatch = useDispatch();

  const [loadingStates, setLoadingStates] = useState({
    clearLocalStorage: false,
    clearAsyncStorage: false,
    clearMmkvStorage: false,
  });

  const onExperimentalKeyChange = useCallback(
    (value: any) => {
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
      const ready = await web3SetHttpProvider((ios && HARDHAT_URL_IOS) || (android && HARDHAT_URL_ANDROID) || 'http://127.0.0.1:8545');
      logger.log('connected to hardhat', ready);
    } catch (e) {
      await web3SetHttpProvider(networkTypes.mainnet);
      logger.log('error connecting to hardhat', e);
    }
    navigate(Routes.PROFILE_SCREEN);
    dispatch(explorerInit());
  }, [dispatch, navigate]);

  const checkAlert = useCallback(async () => {
    try {
      const request = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest');
      if (android && request.status === 500) throw new Error('failed');
      await request.json();
      Alert.alert(lang.t('developer_settings.status'), lang.t('developer_settings.not_applied'));
    } catch (e) {
      Alert.alert(lang.t('developer_settings.status'), lang.t('developer_settings.applied'));
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

  const clearAllNotificationSettings = useCallback(async () => {
    // loop through notification settings and unsubscribe all wallets
    // from firebase first or we’re gonna keep getting them even after
    // clearing storage and before changing settings
    removeGlobalNotificationSettings();
    if (walletNotificationSettings.length > 0) {
      return Promise.all(walletNotificationSettings.map(wallet => removeNotificationSettingsForWallet(wallet.address)));
    }
    return Promise.resolve();
  }, [walletNotificationSettings]);

  const clearPendingTransactions = async () => {
    const { clearPendingTransactions: clearPendingTxs } = pendingTransactionsStore.getState();
    const { clearNonces } = nonceStore.getState();

    clearPendingTxs();
    clearNonces();
  };

  const clearLocalStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearLocalStorage: true }));

    await clearAllNotificationSettings();
    await AsyncStorage.clear();
    clearAllStorages();
    addDefaultNotificationGroupSettings(true);

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
    addDefaultNotificationGroupSettings(true);

    setLoadingStates(prev => ({ ...prev, clearMmkvStorage: false }));
  };

  const wipeKeychainWithAlert = async () => {
    const confirmKeychainAlert = () =>
      new Promise<boolean>(resolve => {
        Alert.alert(lang.t('developer_settings.keychain.alert_title'), lang.t('developer_settings.keychain.alert_body'), [
          {
            onPress: () => {
              resolve(true);
            },
            text: lang.t('developer_settings.keychain.delete_wallets'),
          },
          {
            onPress: () => {
              resolve(false);
            },
            style: 'cancel',
            text: lang.t('button.cancel'),
          },
        ]);
      });

    const isAuth = await isAuthenticated();

    // we should require auth before wiping the keychain
    if (isAuth) {
      const shouldWipeKeychain = await confirmKeychainAlert();
      if (shouldWipeKeychain) {
        await wipeKeychain();
        await clearMMKVStorage();

        // we need to navigate back to the welcome screen
        navigate(Routes.WELCOME_SCREEN);
      }
    }
  };

  const onPressNavigationEntryPoint = () =>
    navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
      screen: Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET,
      // params: { errorType: 'off_or_locked' },
    });

  return (
    <MenuContainer testID="developer-settings-sheet">
      <Menu header={IS_DEV || isTestFlight ? 'Normie Settings' : ''}>
        {/* <MenuItem
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
        {testnetsEnabled && <NetworkSection inDevSection />} */}
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
          onPress={clearLocalStorage}
          size={52}
          titleComponent={<MenuItem.Title text={lang.t('developer_settings.clear_local_storage')} />}
          rightComponent={loadingStates.clearLocalStorage && <SettingsLoadingIndicator />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
          onPress={clearPendingTransactions}
          size={52}
          testID="clear-pending-transactions-section"
          titleComponent={<MenuItem.Title text={lang.t('developer_settings.clear_pending_txs')} />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🚨" isEmoji />}
          onPress={wipeKeychainWithAlert}
          size={52}
          testID="reset-keychain-section"
          titleComponent={<MenuItem.Title text={lang.t('developer_settings.keychain.menu_title')} />}
        />
      </Menu>
      {(IS_DEV || isTestFlight) && (
        <>
          <Menu header="Rainbow Developer Settings">
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={clearAsyncStorage}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.clear_async_storage')} />}
              rightComponent={loadingStates.clearAsyncStorage && <SettingsLoadingIndicator />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={clearMMKVStorage}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.clear_mmkv_storage')} />}
              rightComponent={loadingStates.clearMmkvStorage && <SettingsLoadingIndicator />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="📷️" isEmoji />}
              onPress={clearImageMetadataCache}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.clear_image_metadata_cache')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="📷️" isEmoji />}
              onPress={clearImageCache}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.clear_image_cache')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔄" isEmoji />}
              onPress={() => Restart.Restart()}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.restart_app')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={throwRenderError}
              size={52}
              testID="crash-app-section"
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.crash_app_render_error')} />}
            />
            {errorObj}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗑️" isEmoji />}
              onPress={removeBackups}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.remove_all_backups')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🤷" isEmoji />}
              onPress={() => AsyncStorage.removeItem('experimentalConfig')}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.reset_experimental_config')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="👷" isEmoji />}
              onPress={connectToHardhat}
              size={52}
              testID="hardhat-section"
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.connect_to_hardhat')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🏖️" isEmoji />}
              onPress={checkAlert}
              size={52}
              testID="alert-section"
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.alert')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗺️" isEmoji />}
              onPress={onPressNavigationEntryPoint}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.navigation_entry_point')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🤖" isEmoji />}
              onPress={async () => {
                const publicKey = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();

                if (publicKey) {
                  Clipboard.setString(publicKey);
                }

                Alert.alert(publicKey ? `Copied` : `Couldn't get public key`);
              }}
              size={52}
              titleComponent={<MenuItem.Title text={'Copy signing wallet address'} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🌎" isEmoji />}
              onPress={async () => {
                const fcmToken = await getFCMToken();

                if (fcmToken) {
                  Clipboard.setString(fcmToken);
                }

                Alert.alert(fcmToken ? `Copied` : `Couldn't get fcm token`);
              }}
              size={52}
              titleComponent={<MenuItem.Title text={'Copy FCM token'} />}
            />
            {getExperimetalFlag(LOG_PUSH) && (
              <MenuItem
                leftComponent={<MenuItem.TextIcon icon="📋" isEmoji />}
                onPress={async () => {
                  const logs = serialize();
                  Clipboard.setString(logs);
                  Alert.alert(`Copied`);
                }}
                size={52}
                titleComponent={<MenuItem.Title text={'Copy log lines'} />}
              />
            )}
          </Menu>
          <Menu header="Feature Flags">
            {Object.keys(config)
              .sort()
              .filter(key => (defaultConfig as any)[key]?.settings)
              .map(key => (
                <MenuItem
                  key={key}
                  onPress={() => onExperimentalKeyChange(key)}
                  rightComponent={!!config[key] && <MenuItem.StatusIcon status="selected" />}
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
