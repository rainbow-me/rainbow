import AsyncStorage from '@react-native-community/async-storage';
import Clipboard from '@react-native-community/clipboard';
import React, { useCallback, useContext } from 'react';
import { ScrollView } from 'react-native';
import { DEV_SEEDS } from 'react-native-dotenv';
import { web3SetHttpProvider } from '../../handlers/web3';
import { DevContext } from '../../helpers/DevContext';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';
import logger from 'logger';

const DevSection = () => {
  const { config, setConfig } = useContext(DevContext);

  const onNetworkChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
    },
    [config, setConfig]
  );

  const connectToGanache = useCallback(async () => {
    try {
      const ready = await web3SetHttpProvider('http://127.0.0.1:7545');
      logger.log('connected to ganache', ready);
    } catch (e) {
      logger.log('error connecting to ganache');
    }
  }, []);

  return (
    <ScrollView>
      <ListItem label="💥 Clear async storage" onPress={AsyncStorage.clear} />
      <ListItem
        label="🔄 Restart app"
        onPress={() => {
          // we cannot do import in prod
          const RNRestart = require('react-native-restart');
          RNRestart && RNRestart.default.Restart();
        }}
      />
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
