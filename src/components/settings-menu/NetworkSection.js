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

const networkListItems = NETWORKS.map(({ disabled, name }) => ({
  disabled,
  key: name,
  label: name,
  value: name,
}));

const NetworkSection = ({ network }) => (
  <RadioList
    extraData={network}
    items={networkListItems}
    renderItem={RadioListItem}
    value={network}
  />
);

NetworkSection.propTypes = {
  network: PropTypes.string,
};

export default onlyUpdateForKeys(['network'])(NetworkSection);
