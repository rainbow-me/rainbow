import AsyncStorage from '@react-native-community/async-storage';
import lang from 'i18n-js';
import React, { useCallback, useContext, useState } from 'react';
import { Alert, InteractionManager, Switch } from 'react-native';
// eslint-disable-next-line import/default
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
import { settingsUpdateNetwork } from '../../redux/settings';
import { useDispatch } from 'react-redux';
import { defaultConfig } from '../../config/experimental';
import useAppVersion from '../../hooks/useAppVersion';
import NetworkSection from './NetworkSection';
import { deleteAllBackups } from '@rainbow-me/handlers/cloudBackup';
import {
  getProviderForNetwork,
  web3SetHttpProvider,
} from '@rainbow-me/handlers/web3';
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
  useUpdateAssetOnchainBalance,
  useWallets,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { wipeKeychain } from '@rainbow-me/model/keychain';
import { clearAllStorages } from '@rainbow-me/model/mmkv';
import { Navigation } from '@rainbow-me/navigation';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { explorerInit } from '@rainbow-me/redux/explorer';
import { clearImageMetadataCache } from '@rainbow-me/redux/imageMetadata';
import store from '@rainbow-me/redux/store';
import { walletsUpdate } from '@rainbow-me/redux/wallets';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';
import MenuContainer from './components/MenuContainer';
import Menu from './components/Menu';
import MenuItem from './components/MenuItem';
import isTestFlight from '@rainbow-me/helpers/isTestFlight';
import NetworkSectionV2 from './NetworkSectionV2';

const DevSectionV2 = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext) as any;
  const { wallets } = useWallets();
  const {
    accountAddress,
    testnetsEnabled,
    settingsChangeTestnetsEnabled,
  } = useAccountSettings();
  const dispatch = useDispatch();
  const updateAssetOnchainBalanceIfNeeded = useUpdateAssetOnchainBalance();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();

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
      logger.log('error connecting to hardhat');
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

  const navToDevNotifications = useCallback(() => {
    navigate('DevNotificationsSection');
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

  const clearLocalStorage = useCallback(async () => {
    await AsyncStorage.clear();
    clearAllStorages();
  }, []);

  return (
    <MenuContainer>
      <Menu header={IS_DEV || isTestFlight ? 'Normie Settings' : ''}>
        <MenuItem
          titleComponent={<MenuItem.Title text="Enable Testnets" />}
          disabled
          leftComponent={<MenuItem.Title text="🕹️" />}
          rightComponent={
            <Switch
              onValueChange={toggleTestnetsEnabled}
              value={testnetsEnabled}
            />
          }
          size="medium"
          iconPadding="large"
        />
        {testnetsEnabled && <NetworkSectionV2 inDevSection />}
        <MenuItem
          titleComponent={<MenuItem.Title text="Clear local storage" />}
          leftComponent={<MenuItem.EmojiIcon>💥</MenuItem.EmojiIcon>}
          size="medium"
          iconPadding="large"
          onPress={clearLocalStorage}
        />
      </Menu>
      {(IS_DEV || isTestFlight) && (
        <>
          <Menu header="Rainbow Developer Settings">
            <MenuItem
              onPress={AsyncStorage.clear}
              leftComponent={<MenuItem.EmojiIcon>💥</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_async_storage')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={clearAllStorages}
              leftComponent={<MenuItem.EmojiIcon>💥</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_mmkv_storage')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={clearImageMetadataCache}
              leftComponent={<MenuItem.EmojiIcon>📷️</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_image_metadata_cache')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={clearImageCache}
              leftComponent={<MenuItem.EmojiIcon>📷️</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.clear_image_cache')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={wipeKeychain}
              leftComponent={<MenuItem.EmojiIcon>💣</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.reset_keychain')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={() => Restart.Restart()}
              leftComponent={<MenuItem.EmojiIcon>🔄</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.restart_app')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={throwRenderError}
              leftComponent={<MenuItem.EmojiIcon>💥</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.crash_app_render_error')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            {errorObj}
            <MenuItem
              onPress={removeBackups}
              leftComponent={<MenuItem.EmojiIcon>🗑️</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.remove_all_backups')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={() => AsyncStorage.removeItem('experimentalConfig')}
              leftComponent={<MenuItem.EmojiIcon>🤷</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t(
                    'developer_settings.restore_default_experimental_config'
                  )}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={connectToHardhat}
              leftComponent={<MenuItem.EmojiIcon>👷</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.connect_to_hardhat')}
                />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={checkAlert}
              leftComponent={<MenuItem.EmojiIcon>🏖️</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title text={lang.t('developer_settings.alert')} />
              }
              iconPadding="large"
              size="medium"
            />
            <MenuItem
              onPress={navToDevNotifications}
              leftComponent={<MenuItem.EmojiIcon>🔔</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.notifications_debug')}
                />
              }
              iconPadding="large"
              size="medium"
            />

            <MenuItem
              onPress={syncCodepush}
              leftComponent={<MenuItem.EmojiIcon>⏩</MenuItem.EmojiIcon>}
              titleComponent={
                <MenuItem.Title
                  text={lang.t('developer_settings.sync_codepush', {
                    codePushVersion: codePushVersion,
                  })}
                />
              }
              iconPadding="large"
              size="medium"
            />
          </Menu>
          <Menu header="Feature Flags">
            {Object.keys(config)
              .sort()
              .filter(key => (defaultConfig as any)[key]?.settings)
              .map(key => (
                <MenuItem
                  onPress={() => onExperimentalKeyChange(key)}
                  rightComponent={
                    !!config[key] && <MenuItem.StatusIcon status="selected" />
                  }
                  size="medium"
                  iconPadding="large"
                  titleComponent={<MenuItem.Title text={key} />}
                />
              ))}
          </Menu>
        </>
      )}
    </MenuContainer>
  );
};

export default DevSectionV2;
