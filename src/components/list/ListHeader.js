import PropTypes from 'prop-types';
import React, { createElement, Fragment } from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { Row } from '../layout';
import { H1 } from '../text';
import ContextMenu from '../ContextMenu';
import Divider from '../Divider';

const ListHeaderHeight = 42;

const Header = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 19, 3, 19)}
  background-color: ${colors.white};
  height: ${ListHeaderHeight};
  width: 100%;
`;

const ListHeader = pure(({
  children,
  contextMenuOptions,
  showDivider,
  title,
  titleRenderer,
}) => (
  <Fragment>
    <Header>
      <Row align="center">
        {createElement(titleRenderer, { children: title })}
        {contextMenuOptions && (<ContextMenu {...contextMenuOptions} />)}
      </Row>
      {children}
    </Header>
    {showDivider && <Divider />}
  </Fragment>
));

ListHeader.propTypes = {
  children: PropTypes.node,
  contextMenuOptions: PropTypes.object,
  showDivider: PropTypes.bool,
  title: PropTypes.string,
  titleRenderer: PropTypes.func,
};

ListHeader.defaultProps = {
  showDivider: true,
  titleRenderer: H1,
};

ListHeader.height = ListHeaderHeight;

export default ListHeader;
