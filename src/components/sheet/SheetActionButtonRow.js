import PropTypes from 'prop-types';
import React, { Children, cloneElement } from 'react';
import { padding } from '../../styles';
import { FlexItem, Row } from '../layout';

const renderButton = child =>
  child ? (
    <FlexItem marginHorizontal={7.5}>{cloneElement(child)}</FlexItem>
  ) : null;

const SheetActionButtonRow = ({ children }) => (
  <Row css={padding(24, 7.5)} width="100%">
    {Children.map(children, renderButton)}
  </Row>
);

SheetActionButtonRow.propTypes = {
  children: PropTypes.node,
};

export default React.memo(SheetActionButtonRow);
