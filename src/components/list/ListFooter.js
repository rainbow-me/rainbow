import React from 'react';
import { View } from 'react-primitives';
import { colors } from '../../styles';

const ListFooterHeight = 27;

const neverRerender = () => true;
const ListFooter = React.memo(
  props => (
    <View
      {...props}
      backgroundColor={colors.transparent}
      height={ListFooterHeight}
      width="100%"
    />
  ),
  neverRerender
);

ListFooter.displayName = 'ListFooter';
ListFooter.height = ListFooterHeight;

export default ListFooter;
