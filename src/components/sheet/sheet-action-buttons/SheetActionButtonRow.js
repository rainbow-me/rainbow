import React, { Children } from 'react';
import styled from 'styled-components/primitives';
import { FlexItem, Row } from '../../layout';
import { padding } from '@rainbow-me/styles';

const Container = styled(Row)`
  ${padding(19, 11.5, 24)}
  width: 100%;
  z-index: 2;
`;

function renderButton(child) {
  if (!child) return null;
  return <FlexItem marginHorizontal={7.5}>{child}</FlexItem>;
}

const ActionRowAndroid = styled.View`
  flex-direction: row;
  height: 44;
  margin-vertical: 12;
  margin-horizontal: 12;
  justify-content: space-around;
`;

function ActionRow({ children }) {
  return <Container>{Children.map(children, renderButton)}</Container>;
}

const SheetActionButtonRow = android ? ActionRowAndroid : ActionRow;

export default SheetActionButtonRow;
