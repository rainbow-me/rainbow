import { get, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { colors, position } from '../../styles';
import { Row } from '../layout';
import Icon from '../icons/Icon';
import { Text } from '../text';

const TransactionStatusProps = {
  failed: {
    color: colors.red,
    name: 'close',
  },
  received: {
    color: colors.blueGreyDark,
    direction: 'down',
    name: 'arrow',
  },
  receiving: {
    color: colors.primaryBlue,
    name: 'spinner',
  },
  self: {
    color: colors.blueGreyLight,
    name: 'dot',
  },
  sending: {
    color: colors.primaryBlue,
    name: 'spinner',
  },
  sent: {
    color: colors.blueGreyMediumLight,
    direction: 'up',
    name: 'arrow',
  },
};

const StatusIcon = styled(Icon)`
  ${position.maxSize(10)}
`;

const StatusLabel = styled(Text).attrs({ weight: 'semibold' })`
  margin-left: 6px;
`;

const TransactionStatusBadge = ({ status }) => (
  <Row align="center">
    {status && <StatusIcon {...TransactionStatusProps[status]} />}
    <StatusLabel color={get(TransactionStatusProps, `[${status}].color`, colors.red)}>
      {upperFirst(status || 'Error')}
    </StatusLabel>
  </Row>
);

TransactionStatusBadge.propTypes = {
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

TransactionStatusBadge.defaultProps = {
  status: TransactionStatusTypes.error,
};

export default onlyUpdateForKeys(['status'])(TransactionStatusBadge);
