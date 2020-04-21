import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { withAccountSettings } from '../../hoc';
import { ethereumUtils } from '../../utils/';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize, RequestVendorLogoIcon } from '../coin-icon';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';

const rowRenderPropTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  dappName: PropTypes.string,
  // eslint-disable-next-line react/no-unused-prop-types
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

const BottomRow = ({ dappName }) => <CoinName>{dappName}</CoinName>;

BottomRow.propTypes = rowRenderPropTypes;

const TopRow = ({ status }) => <TransactionStatusBadge status={status} />;

TopRow.propTypes = rowRenderPropTypes;

const ContractInteractionVenderLogoIcon = withProps({
  borderRadius: CoinIconSize,
})(RequestVendorLogoIcon);

const ContractInteractionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.98}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      coinIconRender={ContractInteractionVenderLogoIcon}
      shouldRasterizeIOS
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

ContractInteractionCoinRow.propTypes = rowRenderPropTypes;

export default compose(
  mapProps(({ item: { hash, pending, ...item }, ...props }) => ({
    hash,
    item,
    pending,
    ...props,
  })),
  withAccountSettings,
  withHandlers({
    onPressTransaction: ({ hash, network }) => () => {
      if (hash) {
        showActionSheetWithOptions(
          {
            cancelButtonIndex: 1,
            options: ['View on Etherscan', 'Cancel'],
          },
          buttonIndex => {
            if (buttonIndex === 0) {
              const normalizedHash = hash.replace(/-.*/g, '');
              const etherscanHost = ethereumUtils.getEtherscanHostFromNetwork(
                network
              );
              Linking.openURL(`https://${etherscanHost}/tx/${normalizedHash}`);
            }
          }
        );
      }
    },
  }),
  onlyUpdateForKeys(['hash', 'pending'])
)(ContractInteractionCoinRow);
