import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { BackButton, HeaderButton } from '../header';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  size: 'large',
  weight: 'bold',
})``;

const Header = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  flex: 1;
  height: 42;
  width: 100%;
`;

const DiscoverSheetHeader = props => {
  return (
    <Fragment>
      <Header {...props}>
        <BackButton />
        <Centered cover>
          <HeaderTitle>Discover</HeaderTitle>
        </Centered>
        <Centered>
          <HeaderButton>
            <Icon name="scanner" />
          </HeaderButton>
        </Centered>
      </Header>
    </Fragment>
  );
};

export default DiscoverSheetHeader;
