import PropTypes from 'prop-types';
import React from 'react';
import Row from '../layout/Row';
import Tab from './Tab';

const Tabs = ({ items, onChange, selectedTab }) => (
  <Row justify="space-between">
    {items.map(item => (
      <Tab
        key={item}
        label={item}
        onPress={newSelection => onChange(newSelection)}
        selected={item === selectedTab}
      />
    ))}
  </Row>
);

Tabs.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func,
  selectedTab: PropTypes.string,
};

export default Tabs;
