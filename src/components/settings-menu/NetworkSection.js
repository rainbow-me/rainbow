import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { compose, withHandlers } from 'recompose';
import { RadioList, RadioListItem } from '../radio-list';
import { withAccountSettings, withDataInit } from '../../hoc';
import upperFirst from 'lodash/upperFirst';

const NETWORKS = [
  { disabled: false, name: 'Mainnet' },
  { disabled: true, name: 'Ropsten' },
  { disabled: true, name: 'Kovan' },
  { disabled: false, name: 'Rinkeby' },
];

const NetworkSection = ({ network, onNetworkChange }) => (
  <RadioList
    extraData={network}
    items={NETWORKS.map(({ disabled, name }) => ({
      disabled,
      key: name,
      label: name,
      selected: network.toLowerCase() === name.toLowerCase() ? true : false,
      value: name,
    }))}
    renderItem={RadioListItem}
    value={upperFirst(network)}
    onChange={onNetworkChange}
  />
);

NetworkSection.propTypes = {
  network: PropTypes.string,
};

NetworkSection.defaultProps = {
  onNetworkChange: PropTypes.func.isRequired,
};

export default compose(
  withAccountSettings,
  withDataInit,
  withHandlers({
    onNetworkChange: ({
      settingsUpdateNetwork,
      clearAccountData,
    }) => network => {
      settingsUpdateNetwork(network.toLowerCase());
      clearAccountData();
      analytics.track('Changed network', { network });
    },
  }),
  onlyUpdateForKeys(['network'])
)(NetworkSection);
