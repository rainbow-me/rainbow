import AsyncStorage from '@react-native-community/async-storage';
import Clipboard from '@react-native-community/clipboard';
import React, { useCallback, useContext } from 'react';
import { ScrollView } from 'react-native';
import { DEV_SEEDS } from 'react-native-dotenv';
import { DevContext } from '../../helpers/DevContext';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';

const DevSection = () => {
  const { config, setConfig } = useContext(DevContext);

  const onNetworkChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
    },
    [config, setConfig]
  );

  return (
    <ScrollView>
      <ListItem label="💥 Clear async storage" onPress={AsyncStorage.clear} />
      <ListItem
        onPress={() => {
          // we cannot do import in prod
          const RNRestart = require('react-native-restart');
          RNRestart && RNRestart.default.Restart();
        }}
        label="🔄 Restart app"
      />
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
          label={key}
          key={key}
          selected={!!config[key]}
          onPress={() => onNetworkChange(key)}
        />
      ))}
    </ScrollView>
  );
};

export default DevSection;
