import analytics from '@segment/analytics-react-native';
import { toLower, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { compose, withHandlers } from 'recompose';
import { withAccountSettings, withDataInit } from '../../hoc';
import { RadioList, RadioListItem } from '../radio-list';

const NETWORKS = [
  { disabled: false, name: 'Mainnet' },
  { disabled: false, name: 'Rinkeby' },
];

const NetworkSection = ({ network, onNetworkChange }) => (
  <RadioList
    extraData={network}
    items={NETWORKS.map(({ disabled, name }) => ({
      disabled,
      key: name,
      label: name,
      selected: toLower(network) === toLower(name),
      value: name,
    }))}
    renderItem={RadioListItem}
    value={upperFirst(network)}
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
      await loadAccountData();
      await initializeAccountData();
      analytics.track('Changed network', { network });
    },
  }),
  onlyUpdateForKeys(['network'])
)(NetworkSection);
