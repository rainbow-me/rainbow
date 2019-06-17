import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { RadioList, RadioListItem } from '../radio-list';

const NETWORKS = [
  { name: 'Mainnet', selected: true },
  { disabled: true, name: 'Ropsten' },
  { disabled: true, name: 'Kovan' },
  { disabled: true, name: 'Rinkeby' },
];

const buildNetworkListItem = ({ disabled, name }) => ({
  disabled,
  key: name,
  label: name,
  value: name,
});

const NetworkSection = ({ network }) => (
  <RadioList
    extraData={network}
    items={NETWORKS.map(buildNetworkListItem)}
    renderItem={RadioListItem}
    value={network}
  />
);

NetworkSection.propTypes = {
  network: PropTypes.string,
};

NetworkSection.defaultProps = {
  network: 'Mainnet',
};

export default onlyUpdateForKeys(['network'])(NetworkSection);
