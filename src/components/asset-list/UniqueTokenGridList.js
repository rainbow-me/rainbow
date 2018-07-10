import PropTypes from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import UniqueTokenCard from './UniqueTokenCard';

const GridList = styled(FlatList)`
  ${padding(0, 20)}
`;

const UniqueTokenGridList = ({ item, index, ...rest }) => {
  console.log('GRID LIST rest', rest);

  return (
    <GridList
      data={item}
      key={index}
      numColumns={2}
      renderItem={({ index, ...itemProps }) => (
        console.log('ITEM PROPS ITEM PROPS', itemProps),
        <UniqueTokenCard
          {...itemProps}
          key={index}
          style={{
            marginTop: 15,
            marginRight: (index % 2 === 0) ? 15 : 0,
          }}
        />
      )}
    />
  );
};

UniqueTokenGridList.propTypes = {
  item: PropTypes.array,
};

export default UniqueTokenGridList;
