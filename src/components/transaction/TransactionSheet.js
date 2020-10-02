import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import styled from 'styled-components/primitives';
import { GasSpeedButton } from '../../components/gas';
import { safeAreaInsetValues } from '../../utils';
import { isMessageDisplayType } from '../../utils/signingMethods';
import Divider from '../Divider';
import { Column } from '../layout';
import { borders, colors, padding } from '@rainbow-me/styles';

const Container = styled(Column).attrs({ justify: 'end' })`
  ${borders.buildRadius('top', 20)}
  background-color: ${colors.white};
  flex-grow: 0;
  padding-bottom: ${safeAreaInsetValues.bottom};
  width: 100%;
`;
const GasSpeedButtonContainer = styled(Column)`
  justify-content: flex-start;
  margin-bottom: 19px;
`;

const SendButtonContainer = styled(Column)`
  ${padding(2, 15, 14)};
  flex-shrink: 0;
  width: 100%;
`;

const TransactionSheet = ({ children, method, sendButton, ...props }) => {
  return (
    <Container {...props}>
      {Children.map(children, (child, index) => (
        <Fragment>
          {child}
          {index < children.length - 1 && <Divider />}
        </Fragment>
      ))}
      <SendButtonContainer>
        {!isMessageDisplayType(method) && (
          <GasSpeedButtonContainer>
            <GasSpeedButton type="transaction" />
          </GasSpeedButtonContainer>
        )}
        {sendButton}
      </SendButtonContainer>
    </Container>
  );
};

TransactionSheet.propTypes = {
  children: PropTypes.node,
  sendButton: PropTypes.node,
};

export default TransactionSheet;
