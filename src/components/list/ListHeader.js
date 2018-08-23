import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { Row } from '../layout';
import { H1 } from '../text';
import ContextMenu from '../ContextMenu';
import Divider from '../Divider';

const ListHeaderHeight = 35;

const Header = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 19)}
  background-color: ${colors.white};
  height: ${ListHeaderHeight};
  width: 100%;
`;

const ListHeader = pure(({
  children,
  contextMenuOptions,
  title,
}) => (
  <React.Fragment>
    <Header>
      <Row align="center">
        <H1>{title}</H1>
        {contextMenuOptions && (<ContextMenu {...contextMenuOptions} />)}
      </Row>
      {children}
    </Header>
    <Divider />
  </React.Fragment>
));

ListHeader.propTypes = {
  children: PropTypes.node,
  contextMenuOptions: PropTypes.object,
  title: PropTypes.string,
};

ListHeader.height = ListHeaderHeight;

export default ListHeader;
