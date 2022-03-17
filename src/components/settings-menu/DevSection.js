import AsyncStorage from '@react-native-community/async-storage';
import React, { useCallback, useContext } from 'react';
import { Alert, ScrollView } from 'react-native';
import { HARDHAT_URL_ANDROID, HARDHAT_URL_IOS } from 'react-native-dotenv';
import Restart from 'react-native-restart';
import { useDispatch } from 'react-redux';
import { defaultConfig } from '../../config/experimental';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';
import UserDevSection from './UserDevSection';
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
      logger.log('error connecting to hardhat', e);
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
      Alert.alert('Status', 'NOT APPLIED');
    } catch (e) {
      Alert.alert('Status', 'APPLIED');
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

    Alert.alert('Backups deleted succesfully');
    Restart();
  };

  const [errorObj, setErrorObj] = useState(null);

  const throwRenderError = () => {
    setErrorObj({ error: 'this throws render error' });
  };

  return (
    <ScrollView testID="developer-settings-modal">
      <ListItem label="💥 Clear async storage" onPress={AsyncStorage.clear} />
      <ListItem
        label="📷️ Clear Image Metadata Cache"
        onPress={clearImageMetadataCache}
      />
      <ListItem
        label="💣 Reset Keychain"
        onPress={wipeKeychain}
        testID="reset-keychain-section"
      />
      <ListItem label="🔄 Restart app" onPress={() => Restart.Restart()} />
      <ListItem
        label="💥 Crash app (render error)"
        onPress={throwRenderError}
        testID="crash-app-section"
      />
      {errorObj}
      <ListItem label="🗑️ Remove all backups" onPress={removeBackups} />
      <ListItem
        label="🤷 Restore default experimental config"
        onPress={() => AsyncStorage.removeItem('experimentalConfig')}
      />
      <ListItem
        label="‍👷 Connect to hardhat"
        onPress={connectToHardhat}
        testID="hardhat-section"
      />
      <ListItem label="‍🏖️ Alert" onPress={checkAlert} testID="alert-section" />
      <UserDevSection scrollEnabled={false} />
      {Object.keys(config)
        .sort()
        .filter(key => defaultConfig[key].settings)
        .map(key => (
          <RadioListItem
            key={key}
            label={key}
            onPress={() => onNetworkChange(key)}
            selected={!!config[key]}
          />
        ))}
      <ListFooter />
    </ScrollView>
  );
};

export default DevSection;
