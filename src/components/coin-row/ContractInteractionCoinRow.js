import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withHandlers,
} from 'recompact';
import { Linking } from 'react-native';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { colors } from '../../styles';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import { RequestVendorLogoIcon } from '../coin-icon';

const rowRenderPropTypes = {
  item: PropTypes.object,
  dappName: PropTypes.string,
  onPressTransaction: PropTypes.func,
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

const BottomRow = ({ dappName }) => {
  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName>{dappName}</CoinName>
      </FlexItem>
    </Row>
  );
};

BottomRow.propTypes = rowRenderPropTypes;

const TopRow = ({ status }) => (
  <Fragment>
    <TransactionStatusBadge status={status} />
  </Fragment>
);

TopRow.propTypes = rowRenderPropTypes;

const ContractInteractionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      coinIconRender={RequestVendorLogoIcon}
      bottomRowRender={BottomRow}
      shouldRasterizeIOS={true}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

ContractInteractionCoinRow.propTypes = rowRenderPropTypes;

export default compose(
  mapProps(({
    item: {
      hash,
      pending,
      ...item
    },
    ...props
  }) => ({
    hash,
    item,
    pending,
    ...props,
  })),
  withHandlers({
    onPressTransaction: ({ hash }) => () => {
      if (hash) {
        showActionSheetWithOptions({
          cancelButtonIndex: 1,
          options: ['View on Etherscan', 'Cancel'],
        }, (buttonIndex) => {
          if (buttonIndex === 0) {
            const normalizedHash = hash.replace(/-.*/g, '');
            Linking.openURL(`https://etherscan.io/tx/${normalizedHash}`);
          }
        });
      }
    },
  }),
  onlyUpdateForKeys(['hash', 'pending']),
)(ContractInteractionCoinRow);
