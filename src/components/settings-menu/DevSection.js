import AsyncStorage from '@react-native-community/async-storage';
import Clipboard from '@react-native-community/clipboard';
import React, { useCallback, useContext } from 'react';
import { Alert, ScrollView } from 'react-native';
import { DEV_SEEDS, GANACHE_URL } from 'react-native-dotenv';
import { Restart } from 'react-native-restart';
import { deleteAllBackups } from '../../handlers/cloudBackup';
import { web3SetHttpProvider } from '../../handlers/web3';
import { RainbowContext } from '../../helpers/RainbowContext';
import networkTypes from '../../helpers/networkTypes';
import { useWallets } from '../../hooks';
import { wipeKeychain } from '../../model/keychain';
import { useNavigation } from '../../navigation/Navigation';
import store from '../../redux/store';
import { walletsUpdate } from '../../redux/wallets';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext);
  const { wallets } = useWallets();

  const onNetworkChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
    },
    [config, setConfig]
  );

  const connectToGanache = useCallback(async () => {
    try {
      const ready = await web3SetHttpProvider(
        GANACHE_URL || 'http://127.0.0.1:7545'
      );
      logger.log('connected to ganache', ready);
    } catch (e) {
      await web3SetHttpProvider(networkTypes.mainnet);
      logger.log('error connecting to ganache');
    }
    navigate(Routes.PROFILE_SCREEN);
  }, [navigate]);

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

  return (
    <ScrollView testID="developer-settings-modal">
      <ListItem label="💥 Clear async storage" onPress={AsyncStorage.clear} />
      <ListItem
        label="💣 Reset Keychain"
        onPress={wipeKeychain}
        testID="reset-keychain-section"
      />
      <ListItem label="🔄 Restart app" onPress={Restart} />
      <ListItem label="🗑️ Remove all backups" onPress={removeBackups} />
      <ListItem
        label="🤷 Restore default experimental config"
        onPress={() => AsyncStorage.removeItem('experimentalConfig')}
      />
      <ListItem
        label="‍💻 Copy dev seeds"
        onPress={() => Clipboard.setString(DEV_SEEDS)}
      />
      <ListItem
        label="‍👾 Connect to ganache"
        onPress={connectToGanache}
        testID="ganache-section"
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
