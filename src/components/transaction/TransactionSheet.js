import PropTypes from 'prop-types';
import React from 'react';
import { Column } from '../layout';

const TransactionSheet = ({ children, ...props }) => {
  return <Column {...props}>{children}</Column>;
};

TransactionSheet.propTypes = {
  children: PropTypes.node,
  sendButton: PropTypes.node,
};

export default TransactionSheet;
