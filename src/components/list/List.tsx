import { PropTypes } from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
import ListItem from './ListItem';
import ListItemDivider from './ListItemDivider';

const getListItemLayout = (data, index) => ({
  index,
  length: ListItem.height,
  offset: ListItem.height * index,
});

const List = ({ getItemLayout, items, renderItem, ...props }) => (
  <FlatList
    ItemSeparatorComponent={ListItemDivider}
    data={items}
    getItemLayout={getItemLayout}
    removeClippedSubviews
    renderItem={renderItem}
    scrollEventThrottle={16}
    {...props}
  />
);

List.propTypes = {
  getItemLayout: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
    })
  ).isRequired,
  renderItem: PropTypes.func.isRequired,
};

List.defaultProps = {
  getItemLayout: getListItemLayout,
};

export default List;
