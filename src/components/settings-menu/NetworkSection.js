import analytics from '@segment/analytics-react-native';
import { toLower, values } from 'lodash';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import networkInfo from '../../helpers/networkInfo';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
} from '../../hooks';
import { settingsUpdateNetwork } from '../../redux/settings';
import { RadioList, RadioListItem } from '../radio-list';

const networks = values(networkInfo);

const NetworkSection = () => {
  const { network } = useAccountSettings();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const dispatch = useDispatch();

  const onNetworkChange = useCallback(
    async network => {
      await resetAccountState();
      await dispatch(settingsUpdateNetwork(network));
      InteractionManager.runAfterInteractions(async () => {
        await loadAccountData(network);
        initializeAccountData();
        analytics.track('Changed network', { network });
      });
    },
    [dispatch, initializeAccountData, loadAccountData, resetAccountState]
  );

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
      marginTop={7}
      onChange={onNetworkChange}
      renderItem={RadioListItem}
      value={network}
    />
  );
};

export default NetworkSection;
