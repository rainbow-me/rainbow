import AsyncStorage from '@react-native-community/async-storage';
import lang from 'i18n-js';
import React, { useCallback, useContext } from 'react';
import { Alert, ScrollView } from 'react-native';
import { HARDHAT_URL_ANDROID, HARDHAT_URL_IOS } from 'react-native-dotenv';
import Restart from 'react-native-restart';
import { useDispatch } from 'react-redux';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';
import { deleteAllBackups } from '@rainbow-me/handlers/cloudBackup';
import { web3SetHttpProvider } from '@rainbow-me/handlers/web3';
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { useWallets } from '@rainbow-me/hooks';
import { wipeKeychain } from '@rainbow-me/model/keychain';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { explorerInit } from '@rainbow-me/redux/explorer';
import { clearImageMetadataCache } from '@rainbow-me/redux/imageMetadata';
import store from '@rainbow-me/redux/store';
import { walletsUpdate } from '@rainbow-me/redux/wallets';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext);
  const { wallets } = useWallets();
  const dispatch = useDispatch();

  const onNetworkChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
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
  }, [dispatch, navigate]);

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

  const [errorObj, setErrorObj] = useState(null);

  const throwRenderError = () => {
    setErrorObj({ error: 'this throws render error' });
  };

  return (
    <ScrollView testID="developer-settings-modal">
      <ListItem
        label={`💥 ${lang.t('developer_settings.clear_async_storage')}`}
        onPress={AsyncStorage.clear}
      />
      <ListItem
        label={`📷️ ${lang.t('developer_settings.clear_image_metadata_cache')}`}
        onPress={clearImageMetadataCache}
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
      <ListFooter />

      {Object.keys(config)
        .sort()
        .map(key => (
          <RadioListItem
            key={key}
            label={key}
            onPress={() => onNetworkChange(key)}
            selected={!!config[key]}
          />
        ))}
    </ScrollView>
  );
};

export default DevSection;
