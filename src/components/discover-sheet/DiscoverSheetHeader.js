import React from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { BackButton, HeaderButton } from '../header';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  opacity: 0.8,
  size: 'large',
  weight: 'bold',
})``;

const Header = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  height: 42;
  margin-bottom: 12;
  top: -12;
  width: 100%;
`;

export default function DiscoverSheetHeader(props) {
  return (
    <Header {...props}>
      <BackButton />
      <Centered cover>
        <HeaderTitle>Discover</HeaderTitle>
      </Centered>
      <HeaderButton>
        <Icon name="scanner" />
      </HeaderButton>
    </Header>
  );
}
