import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { Smallcaps } from '../text';
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  marginLeft: 5,
  marginRight: 5,
})`
  ${padding(0, 19)};
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
