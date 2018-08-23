import React from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';

const ListFooterHeight = 27;

const Spacer = styled.View`
  background-color: ${colors.white};
  height: ${ListFooterHeight};
  width: 100%;
`;

const ListFooter = () => <Spacer />;

ListFooter.height = ListFooterHeight;

export default ListFooter;
