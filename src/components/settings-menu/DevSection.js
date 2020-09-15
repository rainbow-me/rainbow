import AsyncStorage from '@react-native-community/async-storage';
import Clipboard from '@react-native-community/clipboard';
import React, { useCallback, useContext } from 'react';
import { Alert, ScrollView } from 'react-native';
import { DEV_SEEDS, GANACHE_URL } from 'react-native-dotenv';
import { Restart } from 'react-native-restart';
import { deleteAllBackups } from '../../handlers/cloudBackup';
import { web3SetHttpProvider } from '../../handlers/web3';
import { DevContext } from '../../helpers/DevContext';
import { useWallets } from '../../hooks';
import { wipeKeychain } from '../../model/keychain';
import store from '../../redux/store';
import { walletsUpdate } from '../../redux/wallets';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';
import logger from 'logger';

const DevSection = () => {
  const { config, setConfig } = useContext(DevContext);
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
      logger.log('error connecting to ganache');
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

  return (
    <ScrollView>
      <ListItem label="💥 Clear async storage" onPress={AsyncStorage.clear} />
      <ListItem label="💣 Reset Keychain" onPress={wipeKeychain} />
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
      <ListItem label="‍👾 Connect to ganache" onPress={connectToGanache} />
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
