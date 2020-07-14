import React from 'react';
import styled from 'styled-components';
import { RowWithMargins } from '../layout';
import { Nbsp, Text } from '../text';

const SecretDisplayItemText = styled(Text).attrs({
  lineHeight: 'looser',
  size: 'lmedium',
})``;

export default function SecretDisplayItem({
  align = 'left',
  number,
  children,
}) {
  return (
    <RowWithMargins marginBottom={9}>
      <SecretDisplayItemText align={align} color="appleBlue">
        {number}
        {number && <Nbsp />}
        <SecretDisplayItemText align={align} color="blueGreyDark" weight="bold">
          {children}
        </SecretDisplayItemText>
      </SecretDisplayItemText>
    </RowWithMargins>
  );
}
