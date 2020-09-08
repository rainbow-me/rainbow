import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { safeAreaInsetValues } from '../../utils';
import { Column } from '../layout';
import { borders, colors } from '@rainbow-me/styles';

const Container = styled(Column).attrs({ justify: 'end' })`
  ${borders.buildRadius('top', 20)}
  background-color: ${colors.white};
  flex-grow: 0;
  padding-bottom: ${safeAreaInsetValues.bottom};
  width: 100%;
`;

const TransactionSheet = ({ children, ...props }) => {
  return <Container {...props}>{children}</Container>;
};

TransactionSheet.propTypes = {
  children: PropTypes.node,
  sendButton: PropTypes.node,
};

export default TransactionSheet;
