import PropTypes from 'prop-types';
import React, { Children, cloneElement } from 'react';
import { padding } from '../../styles';
import { Row } from '../layout';

const childProps = { marginHorizontal: 7.5 };

const SheetButtonRow = ({ children }) => (
  <Row css={padding(24, 7.5)}>
    {Children.map(children, c => cloneElement(c, childProps))}
  </Row>
);

SheetButtonRow.propTypes = {
  children: PropTypes.node,
};

export default React.memo(SheetButtonRow);
