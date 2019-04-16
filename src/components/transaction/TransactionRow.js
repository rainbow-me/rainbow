import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { padding } from '../../styles';
import { ColumnWithMargins } from '../layout';
import { Smallcaps } from '../text';

const Container = styled(ColumnWithMargins).attrs({ margin: 5 })`
  ${padding(19)};
  flex-shrink: 0;
`;

const TransactionRow = ({ children, title, ...props }) => (
  <Container {...props}>
    {title && <Smallcaps>{title}</Smallcaps>}
    {children}
  </Container>
);

TransactionRow.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string.isRequired,
};

export default TransactionRow;
