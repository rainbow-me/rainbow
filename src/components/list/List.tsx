// @ts-expect-error ts-migrate(2305) FIXME: Module '"prop-types"' has no exported member 'Prop... Remove this comment to see the full error message
import { PropTypes } from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ListItem' was resolved to '/Users/nickby... Remove this comment to see the full error message
import ListItem from './ListItem';
import ListItemDivider from './ListItemDivider';

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'data' implicitly has an 'any' type.
const getListItemLayout = (data, index) => ({
  index,
  length: ListItem.height,
  offset: ListItem.height * index,
});

const List = ({ getItemLayout, items, renderItem, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
