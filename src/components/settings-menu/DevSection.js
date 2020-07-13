import AsyncStorage from '@react-native-community/async-storage';
import Clipboard from '@react-native-community/clipboard';
import React, { useCallback, useContext } from 'react';
import { Alert, ScrollView } from 'react-native';
import { DEV_SEEDS } from 'react-native-dotenv';
import { Restart } from 'react-native-restart';
import { deleteAllBackups } from '../../handlers/cloudBackup';
import { DevContext } from '../../helpers/DevContext';
import { useWallets } from '../../hooks';
import { wipeKeychain } from '../../model/keychain';
import store from '../../redux/store';
import { walletsUpdate } from '../../redux/wallets';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';

const DevSection = () => {
  const { config, setConfig } = useContext(DevContext);
  const { wallets } = useWallets();

  const onNetworkChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
    },
    [config, setConfig]
  );

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
      <ListFooter />

      {Object.keys(config).map(key => (
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
