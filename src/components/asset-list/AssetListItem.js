import PropTypes from 'prop-types';
import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { colors, position } from '../../styles';


const Container = styled(Text)`

`;

  // background-color: ${colors.blue};
  // border-radius: 30;
  // flex: 1;
// const Label = styled.Text`
// `;
//   //

const AssetListItem = ({ item, index, section }) => {
  console.log('item', item);

  return (
    <Container>{item}</Container>
  );
};

// </Container>

export default AssetListItem;
