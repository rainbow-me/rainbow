import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { Smallcaps } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  marginLeft: 5,
  marginRight: 5,
})`
  ${padding(0, 19)};
`;

const TransactionRow = ({ children, title, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Container {...props}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    {title && <Smallcaps>{title}</Smallcaps>}
    {children}
  </Container>
);

TransactionRow.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string.isRequired,
};

export default TransactionRow;
