import { upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import Row from '../layout/Row';
import Icon from '../icons/Icon';

const TransactionTypes = {
  pending: 'pending',
  received: 'received',
  sent: 'sent',
};

const TransactionColors = {
  pending: colors.blue,
  received: colors.blueGreyDark,
  sent: colors.blueGreyMedium,
};

const TransactionIcon = styled(Icon)`

`;

const TransactionLabel = styled.Text`
  color: ${({ color }) => color};
  font-weight: ${fonts.weight.semibold};
  margin-left: 6px;
`;

const TransactionStatusBadge = ({ status }) => (
  <Row align="center">
    <TransactionIcon
      color={TransactionColors[status]}
      direction={(status === TransactionTypes.sent) ? 'up' : 'down'}
      name={(status === TransactionTypes.pending) ? 'spinner' : 'arrow'}
    />
    <TransactionLabel color={TransactionColors[status]}>
      {upperFirst(status)}
    </TransactionLabel>
  </Row>
);

TransactionStatusBadge.propTypes = {
  status: PropTypes.oneOf(Object.values(TransactionTypes)),
};

TransactionStatusBadge.defaultProps = {
  status: TransactionTypes.pending,
};

export default TransactionStatusBadge;
