import analytics from '@segment/analytics-react-native';
import { toLower, values } from 'lodash';
import React from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import networkInfo from '../../helpers/networkInfo';
import {
  useAccountSettings,
  useClearAccountData,
  useLoadAccountData,
  useInitializeAccountData,
} from '../../hooks';
import { RadioList, RadioListItem } from '../radio-list';
import { settingsUpdateNetwork } from '../../redux/settings';

const networks = values(networkInfo);

const NetworkSection = () => {
  const { network } = useAccountSettings();
  const clearAccountData = useClearAccountData();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const dispatch = useDispatch();

  const onNetworkChange = async network => {
    await clearAccountData();
    await dispatch(settingsUpdateNetwork(network));
    InteractionManager.runAfterInteractions(async () => {
      await loadAccountData();
      await initializeAccountData();
      analytics.track('Changed network', { network });
    });
  };

  return (
    <RadioList
      extraData={network}
      items={networks.map(({ disabled, name, value }) => ({
        disabled,
        key: value,
        label: name,
        selected: toLower(network) === toLower(value),
        value,
      }))}
      renderItem={RadioListItem}
      value={network}
      onChange={onNetworkChange}
    />
  );
};

export default NetworkSection;
