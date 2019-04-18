import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import styled from 'styled-components/primitives';
import { borders, colors, padding } from '../../styles';
import { safeAreaInsetValues } from '../../utils';
import Divider from '../Divider';
import { Column } from '../layout';

const Container = styled(Column).attrs({ justify: 'end' })`
  ${borders.buildRadius('top', 15)}
  background-color: ${colors.white};
  flex-grow: 0;
  padding-bottom: ${safeAreaInsetValues.bottom};
  width: 100%;
`;

const SendButtonContainer = styled(Column)`
  ${padding(2, 15, 14)};
  flex-shrink: 0;
  width: 100%;
`;

const TransactionSheet = ({ children, sendButton, ...props }) => (
  <Container {...props}>
    {Children.map(children, (child, index) => (
      <Fragment>
        {child}
        {(index < children.length - 1) && <Divider />}
      </Fragment>
    ))}
    <SendButtonContainer>
      {sendButton}
    </SendButtonContainer>
  </Container>
);

TransactionSheet.propTypes = {
  children: PropTypes.node,
  sendButton: PropTypes.node,
};

export default TransactionSheet;
