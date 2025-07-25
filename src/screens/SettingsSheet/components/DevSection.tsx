import { ImgixImage } from '@/components/images';
import { defaultConfig, getExperimetalFlag, LOG_PUSH } from '@/config';
import { IS_DEV } from '@/env';
import { deleteAllBackups } from '@/handlers/cloudBackup';
import { RainbowContext } from '@/helpers/RainbowContext';
import { WrappedAlert as Alert } from '@/helpers/alert';
import isTestFlight from '@/helpers/isTestFlight';
import { getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded } from '@/helpers/signingWallet';
import { logger, RainbowError } from '@/logger';
import { serialize } from '@/logger/logDump';
import { wipeKeychain } from '@/model/keychain';
import { clearAllStorages } from '@/model/mmkv';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { clearImageMetadataCache } from '@/redux/imageMetadata';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import { clearWalletState, updateWallets, useWallets } from '@/state/wallets/walletsStore';
import { isAuthenticated } from '@/utils/authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import lang from 'i18n-js';
import React, { useCallback, useContext, useState } from 'react';
// @ts-expect-error - react-native-restart is not typed
import Restart from 'react-native-restart';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';

import { addDefaultNotificationGroupSettings } from '@/notifications/settings/initialization';
import { unsubscribeAllNotifications } from '@/notifications/settings/settings';
import { getFCMToken } from '@/notifications/tokens';
import { analyzeReactQueryStore, clearReactQueryCache } from '@/react-query/reactQueryUtils';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { nonceStore } from '@/state/nonces';
import { pendingTransactionsStore } from '@/state/pendingTransactions';
import FastImage from 'react-native-fast-image';

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext) as any;
  const wallets = useWallets();
  const setConnectedToAnvil = useConnectedToAnvilStore.getState().setConnectedToAnvil;

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

  const connectToAnvil = useCallback(async () => {
    try {
      const connectToAnvil = useConnectedToAnvilStore.getState().connectedToAnvil;
      setConnectedToAnvil(!connectToAnvil);
      logger.debug(`[DevSection] connected to anvil`);
    } catch (e) {
      setConnectedToAnvil(false);
      logger.error(new RainbowError(`[DevSection] error connecting to anvil: ${e}`));
    }
    navigate(Routes.PROFILE_SCREEN);
  }, [navigate, setConnectedToAnvil]);

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

    await updateWallets(newWallets);

    // Delete all backups (debugging)
    await deleteAllBackups();

    Alert.alert(lang.t('developer_settings.backups_deleted_successfully'));
    Restart();
  };

  const clearImageCache = async () => {
    try {
      ImgixImage.clearDiskCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing ImgixImage disk cache: ${e}`));
    }

    try {
      // @ts-expect-error - clearImageCache doesn't exist on ImgixImage
      ImgixImage.clearImageCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing ImgixImage cache: ${e}`));
    }

    try {
      FastImage.clearDiskCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing FastImage disk cache: ${e}`));
    }

    try {
      FastImage.clearMemoryCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing FastImage memory cache: ${e}`));
    }
  };

  const [errorObj, setErrorObj] = useState(null as any);

  const throwRenderError = () => {
    setErrorObj({ error: 'this throws render error' });
  };

  const clearPendingTransactions = async () => {
    const { clearPendingTransactions: clearPendingTxs } = pendingTransactionsStore.getState();
    const { clearNonces } = nonceStore.getState();

    clearPendingTxs();
    clearNonces();
  };

  const clearLocalStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearLocalStorage: true }));

    await unsubscribeAllNotifications();
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

    await unsubscribeAllNotifications();
    clearAllStorages();
    addDefaultNotificationGroupSettings(true);

    setLoadingStates(prev => ({ ...prev, clearMmkvStorage: false }));
  };

  const clearWallets = async () => {
    const isAuth = await isAuthenticated();
    if (isAuth) {
      const shouldWipeKeychain = await confirmKeychainAlert();
      if (shouldWipeKeychain) {
        await clearWalletState({ resetKeychain: true });
      }
    }
    // we need to navigate back to the welcome screen
    navigate(Routes.WELCOME_SCREEN);
  };

  const wipeKeychainWithAlert = async () => {
    const isAuth = await isAuthenticated();
    // we should require auth before wiping the keychain
    if (isAuth) {
      const shouldWipeKeychain = await confirmKeychainAlert();
      if (shouldWipeKeychain) {
        await wipeKeychain();
        await clearMMKVStorage();
        await clearWalletState({ resetKeychain: true });

        // we need to navigate back to the welcome screen
        navigate(Routes.WELCOME_SCREEN);
      }
    }
  };

  const onPressNavigationEntryPoint = () =>
    navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
      screen: Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET,
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
              leftComponent={<MenuItem.TextIcon icon="🔄" isEmoji />}
              onPress={() => Restart.Restart()}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.restart_app')} />}
            />
            {/* TEMP: Removal for public TF */}
            {/* <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💳" isEmoji />}
              onPress={clearWallets}
              size={52}
              testID="reset-keychain-section"
              titleComponent={<MenuItem.Title text="Remove all wallets" />}
            /> */}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔦" isEmoji />}
              onPress={() => analyzeReactQueryStore()}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.analyze_react_query')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗑️" isEmoji />}
              onPress={() => clearReactQueryCache()}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.clear_react_query_cache')} />}
            />
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
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={throwRenderError}
              size={52}
              testID="crash-app-section"
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.crash_app_render_error')} />}
            />
            {errorObj}
            {/* TEMP: Removal for public TF}
            {/* <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗑️" isEmoji />}
              onPress={removeBackups}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.remove_all_backups')} />}
            /> */}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🤷" isEmoji />}
              onPress={() => AsyncStorage.removeItem('experimentalConfig')}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.reset_experimental_config')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="👷" isEmoji />}
              onPress={connectToAnvil}
              size={52}
              testID="anvil-section"
              titleComponent={
                <MenuItem.Title
                  text={
                    useConnectedToAnvilStore.getState().connectedToAnvil
                      ? lang.t('developer_settings.disconnect_to_anvil')
                      : lang.t('developer_settings.connect_to_anvil')
                  }
                />
              }
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
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.copy_signing_wallet_address')} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🌎" isEmoji />}
              onPress={async () => {
                const fcmToken = await getFCMToken();

                if (fcmToken) {
                  Clipboard.setString(fcmToken);
                }

                Alert.alert(fcmToken ? 'Copied' : "Couldn't get FCM token");
              }}
              size={52}
              titleComponent={<MenuItem.Title text={lang.t('developer_settings.copy_fcm_token')} />}
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
                titleComponent={<MenuItem.Title text={lang.t('developer_settings.copy_log_lines')} />}
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

function confirmKeychainAlert(): Promise<boolean> {
  return new Promise<boolean>(resolve => {
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
}

export default DevSection;
