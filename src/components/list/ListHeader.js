import PropTypes from 'prop-types';
import React, { createElement, Fragment } from 'react';
import { pure } from 'recompact';
import { colors, padding } from '../../styles';
import { Row } from '../layout';
import { H1 } from '../text';
import ContextMenu from '../ContextMenu';
import Divider from '../Divider';

const height = 42;

const ListHeader = pure(
  ({
    children,
    contextMenuOptions,
    isSticky,
    showDivider,
    title,
    titleRenderer,
  }) => (
    <Fragment>
      <Row
        align="center"
        backgroundColor={isSticky ? colors.white : colors.transparent}
        css={padding(0, 19, 3, 19)}
        height={height}
        justify="space-between"
        width="100%"
      >
        <Row align="center">
          {createElement(titleRenderer, { children: title })}
          {contextMenuOptions && <ContextMenu {...contextMenuOptions} />}
        </Row>
        {children}
      </Row>
      {showDivider && <Divider />}
    </Fragment>
  )
);

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

ListHeader.height = height;

export default ListHeader;
