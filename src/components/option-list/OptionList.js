import { PropTypes } from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
import Divider from '../Divider';
// import { Column } from '../layout';
import OptionListItem from './OptionListItem';

const getItemLayout = (data, index) => ({
  index,
  length: OptionListItem.height,
  offset: OptionListItem.height * index,
});

const keyExtractor = ({ currency }, index) => (`${currency}_${index}`);

const OptionListDivider = () => (
  <Divider
    insetLeft={16}
    insetRight={16}
  />
);

const OptionList = ({ items, renderItem, ...props }) => (
  console.log('options list itesm', items),
  console.log('options list renderitem', renderItem),
  <FlatList
    data={items}
    getItemLayout={getItemLayout}
    ItemSeparatorComponent={OptionListDivider}
    keyExtractor={keyExtractor}
    removeClippedSubviews
    renderItem={renderItem}
    scrollEventThrottle={16}
    {...props}
  />
);

OptionList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  renderItem: PropTypes.func,
};

OptionList.defaultProps = {
  renderItem: OptionListItem,
};

export default OptionList;

// compose(
//   withHandlers({

//   }),
//   withProps({

//   }),
// )();
