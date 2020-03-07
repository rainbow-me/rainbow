import PropTypes from 'prop-types';
import React, { Children, cloneElement } from 'react';
import { padding } from '../../styles';
import { Row, FlexItem } from '../layout';

const childProps = { marginHorizontal: 7.5 };

const SheetActionButtonRow = ({ children }) => (
  <Row css={padding(24, 7.5)}>
    {Children.map(children, c => (
      <FlexItem flex={1} {...childProps}>
        {cloneElement(c)}
      </FlexItem>
    ))}
  </Row>
);

SheetActionButtonRow.propTypes = {
  children: PropTypes.node,
};

export default React.memo(SheetActionButtonRow);
