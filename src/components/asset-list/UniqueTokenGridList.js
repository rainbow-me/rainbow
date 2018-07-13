import PropTypes from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import UniqueTokenCard from './UniqueTokenCard';

const GridList = styled(FlatList)`
  ${padding(0, 20)}
`;

const UniqueTokenGridList = ({ item, ...rest }) => (
  <GridList
    data={item}
    keyExtractor={(listItem, index) => (listItem + index)}
    numColumns={2}
    renderItem={({ index, ...itemProps }) => (
      <UniqueTokenCard
        {...itemProps}
        style={{
          marginTop: 15,
          marginRight: (index % 2 === 0) ? 15 : 0,
        }}
      />
    )}
  />
);

UniqueTokenGridList.propTypes = {
  item: PropTypes.array,
  index: PropTypes.number,
};

export default UniqueTokenGridList;
