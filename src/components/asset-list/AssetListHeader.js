import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Row } from '../layout';
import { H1, Monospace } from '../text';

const BorderLine = styled.View`
  background-color: ${colors.lightGrey};
  border-bottom-left-radius: 2;
  border-top-left-radius: 2;
  height: 2;
  left: 20;
  right: 0;
`;

const Header = styled(Row)`
  height: 35;
  padding-left: 20;
  padding-right: 20;
`;

const AssetListHeader = ({ section: { title } }) => (
  <Fragment>
    <Header align="center" justify="space-between">
      <Row align="center">
        <H1>{title}</H1>
      </Row>
      <Monospace size="large" weight="semibold">
        {'$456.60'}
      </Monospace>
    </Header>
    <BorderLine />
  </Fragment>
);

AssetListHeader.propTypes = {
  section: PropTypes.object,
};

export default AssetListHeader;
