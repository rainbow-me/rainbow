import analytics from '@segment/analytics-react-native';
import { toLower, values } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager } from 'react-native';
import { onlyUpdateForKeys } from 'recompact';
import { compose, withHandlers } from 'recompose';
import networkInfo from '../../helpers/networkInfo';
import { withAccountSettings, withDataInit } from '../../hoc';
import { RadioList, RadioListItem } from '../radio-list';

const networks = values(networkInfo);

const NetworkSection = ({ network, onNetworkChange }) => (
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

NetworkSection.propTypes = {
  network: PropTypes.string,
  onNetworkChange: PropTypes.func.isRequired,
};

export default compose(
  withAccountSettings,
  withDataInit,
  withHandlers({
    onNetworkChange: ({
      settingsUpdateNetwork,
      clearAccountData,
      loadAccountData,
      initializeAccountData,
    }) => async network => {
      await clearAccountData();
      await settingsUpdateNetwork(toLower(network));
      InteractionManager.runAfterInteractions(async () => {
        await loadAccountData();
        await initializeAccountData();
        analytics.track('Changed network', { network });
      });
    },
  }),
  onlyUpdateForKeys(['network'])
)(NetworkSection);
