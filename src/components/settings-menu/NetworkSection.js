import analytics from '@segment/analytics-react-native';
import { toLower } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { compose, withHandlers } from 'recompose';
import { withAccountSettings, withDataInit } from '../../hoc';
import { RadioList, RadioListItem } from '../radio-list';
import networkInfo from '../../helpers/networkInfo';

const networks = Object.keys(networkInfo).map(key => networkInfo[key]);

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
      console.log('Switching to ', network);
      await settingsUpdateNetwork(toLower(network));
      await loadAccountData();
      await initializeAccountData();
      analytics.track('Changed network', { network });
    },
  }),
  onlyUpdateForKeys(['network'])
)(NetworkSection);
