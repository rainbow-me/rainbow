import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { Linking } from 'react-native';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { ButtonPressAnimation } from '../animations';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import { RequestVendorLogoIcon } from '../coin-icon';

const rowRenderPropTypes = {
  dappName: PropTypes.string,
  item: PropTypes.object,
  onPressTransaction: PropTypes.func,
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

const BottomRow = ({ dappName }) => <CoinName>{dappName}</CoinName>;

BottomRow.propTypes = rowRenderPropTypes;

const TopRow = ({ status }) => <TransactionStatusBadge status={status} />;

TopRow.propTypes = rowRenderPropTypes;

const ContractInteractionVenderLogoIcon = withProps({
  borderRadius: RequestVendorLogoIcon.size,
})(RequestVendorLogoIcon);

const ContractInteractionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      coinIconRender={ContractInteractionVenderLogoIcon}
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
