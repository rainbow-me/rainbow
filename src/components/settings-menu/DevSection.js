import AsyncStorage from '@react-native-community/async-storage';
import React, { useCallback, useContext } from 'react';
import { DevContext } from '../../helpers/DevContext';
import { RadioList, RadioListItem } from '../radio-list';

const DevSection = () => {
  const { config, setConfig } = useContext(DevContext);

  const onNetworkChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
    },
    [config, setConfig]
  );

  return (
    <>
      <RadioListItem
        label="Clear async storage"
        selected={false}
        onPress={AsyncStorage.clear}
      />
      <RadioListItem
        label="Restore default experimental config"
        selected={false}
        onPress={() => AsyncStorage.removeItem('experimentalConfig')}
      />
      {/*<RadioListItem label="Restart app" selected={false} onPress={() => {}} />*/}
      {/*<RadioListItem label="Copy dev seeds" selected={false} onPress={() => {}} />*/}
      <RadioList
        extraData={config}
        items={Object.keys(config).map(key => ({
          key: key,
          label: key,
          value: key,
        }))}
        renderItem={props => (
          <RadioListItem
            {...props}
            selected={!!config[props.value]}
            onPress={() => onNetworkChange(props.value)}
          />
        )}
      />
    </>
  );
};

export default DevSection;
