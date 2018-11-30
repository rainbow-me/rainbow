import { PropTypes } from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
import TouchableRow from './TouchableRow';
import TouchableRowDivider from './TouchableRowDivider';

const getItemLayout = (data, index) => ({
  index,
  length: TouchableRow.height,
  offset: TouchableRow.height * index,
});

    // keyExtractor={keyExtractor}
const TouchableRowList = ({
  items,
  renderItem,
  ...props
}) => (
  <FlatList
    data={items}
    getItemLayout={getItemLayout}
    ItemSeparatorComponent={TouchableRowDivider}
    removeClippedSubviews
    renderItem={renderItem}
    scrollEventThrottle={16}
    {...props}
  />
);

TouchableRowList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
  })).isRequired,
  keyExtractor: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
};

export default TouchableRowList;
