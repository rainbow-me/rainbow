import AsyncStorage from '@react-native-community/async-storage';
import lang from 'i18n-js';
import React, { useCallback, useContext } from 'react';
import { Alert, ScrollView } from 'react-native';
// eslint-disable-next-line import/default
import codePush from 'react-native-code-push';
import {
  HARDHAT_URL_ANDROID,
  HARDHAT_URL_IOS,
  IS_TESTING,
} from 'react-native-dotenv';
import Restart from 'react-native-restart';
import { useDispatch } from 'react-redux';
import { defaultConfig } from '../../config/experimental';
import useAppVersion from '../../hooks/useAppVersion';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';
import UserDevSection from './UserDevSection';
import { Divider } from '@rainbow-me/design-system';
import { deleteAllBackups } from '@rainbow-me/handlers/cloudBackup';
import {
  getProviderForNetwork,
  web3SetHttpProvider,
} from '@rainbow-me/handlers/web3';
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import {
  useAccountSettings,
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

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext);
  const { wallets } = useWallets();
  const { accountAddress } = useAccountSettings();
  const dispatch = useDispatch();
  const updateAssetOnchainBalanceIfNeeded = useUpdateAssetOnchainBalance();

  const onExperimentalKeyChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
      if (defaultConfig[value].needsRestart) {
        Navigation.handleAction(Routes.WALLET_SCREEN);
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
      Alert.alert('No update');
    } else {
      // dismissing not to fuck up native nav structure
      navigate(Routes.PROFILE_SCREEN);
      Alert.alert('Installing update');

      const result = await codePush.sync({
        installMode: codePush.InstallMode.IMMEDIATE,
      });

      const resultString = Object.entries(codePush.syncStatus).find(
        e => e[1] === result
      )[0];
      Alert.alert(resultString);
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

    await store.dispatch(walletsUpdate(newWallets));

    // Delete all backups (debugging)
    await deleteAllBackups();

    Alert.alert(lang.t('developer_settings.backups_deleted_successfully'));
    Restart();
  };

  const clearImageCache = async () => {
    ImgixImage.clearDiskCache();
    ImgixImage.clearImageCache();
  };

  const [errorObj, setErrorObj] = useState(null);

  const throwRenderError = () => {
    setErrorObj({ error: 'this throws render error' });
  };

  const codePushVersion = useAppVersion()[1];

  return (
    <ScrollView testID="developer-settings-modal">
      <ListItem
        label={`💥 ${lang.t('developer_settings.clear_async_storage')}`}
        onPress={AsyncStorage.clear}
      />
      <ListItem
        label={`💥 ${lang.t('developer_settings.clear_mmkv_storage')}`}
        onPress={clearAllStorages}
      />
      <ListItem
        label={`📷️ ${lang.t('developer_settings.clear_image_metadata_cache')}`}
        onPress={clearImageMetadataCache}
      />
      <ListItem
        label={`📷️ ${lang.t('developer_settings.clear_image_cache')}`}
        onPress={clearImageCache}
      />
      <ListItem
        label={`💣 ${lang.t('developer_settings.reset_keychain')}`}
        onPress={wipeKeychain}
        testID="reset-keychain-section"
      />
      <ListItem
        label={`🔄 ${lang.t('developer_settings.restart_app')}`}
        onPress={() => Restart.Restart()}
      />
      <ListItem
        label={`💥 ${lang.t('developer_settings.crash_app_render_error')}`}
        onPress={throwRenderError}
        testID="crash-app-section"
      />
      {errorObj}
      <ListItem
        label={`🗑️ ${lang.t('developer_settings.remove_all_backups')}`}
        onPress={removeBackups}
      />
      <ListItem
        label={`🤷 ${lang.t(
          'developer_settings.restore_default_experimental_config'
        )}`}
        onPress={() => AsyncStorage.removeItem('experimentalConfig')}
      />
      <ListItem
        label={`👷 ${lang.t('developer_settings.connect_to_hardhat')}`}
        onPress={connectToHardhat}
        testID="hardhat-section"
      />
      <ListItem
        label={`🏖️ ${lang.t('developer_settings.alert')}`}
        onPress={checkAlert}
        testID="alert-section"
      />
      <ListItem
        label={`🔔 ${lang.t('developer_settings.notifications_debug')}`}
        onPress={navToDevNotifications}
        testID="notifications-section"
      />
      <UserDevSection scrollEnabled={false} />
      <ListItem
        label={`‍⏩ ${lang.t('developer_settings.sync_codepush', {
          codePushVersion: codePushVersion,
        })}`}
        onPress={syncCodepush}
      />
      {Object.keys(config)
        .sort()
        .filter(key => defaultConfig[key]?.settings)
        .map(key => (
          <RadioListItem
            key={key}
            label={key}
            onPress={() => onExperimentalKeyChange(key)}
            selected={!!config[key]}
          />
        ))}

      <Divider />
      <ListFooter />
    </ScrollView>
  );
};

export default DevSection;
