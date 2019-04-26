import { pickBy, values } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import { compose, withHandlers } from 'recompact';
import { withWalletConnectConnections } from '../../hoc';
import { padding } from '../../styles';
import { RequestVendorLogoIcon } from '../coin-icon';
import ContextMenu from '../ContextMenu';
import {
  Centered,
  ColumnWithMargins,
  FlexItem,
  Row,
} from '../layout';
import { Text, TruncatedText } from '../text';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
const WalletConnectListItemHeight = VendorLogoIconSize + (ContainerPadding * 2);

const enhance = compose(
  withWalletConnectConnections,
  withHandlers({
    onPressActionSheet: ({
      dappName,
      walletConnectDisconnectAllByDappName,
    }) => (buttonIndex) => {
      if (buttonIndex === 0) {
        walletConnectDisconnectAllByDappName(dappName);
      }
    },
  }),
);

const WalletConnectListItem = enhance(({
  dappName,
  dappIcon,
  dappUrl,
  onPressActionSheet,
}) => (
  <Row align="center" height={WalletConnectListItemHeight}>
    <Row
      align="center"
      component={FlexItem}
      flex={1}
      css={padding(ContainerPadding, 0, ContainerPadding, ContainerPadding)}
    >
      <RequestVendorLogoIcon
        dappName={dappName}
        imageUrl={dappIcon}
        size={VendorLogoIconSize}
      />
      <ColumnWithMargins
        css={padding(0, 18, 1.5, 12)}
        flex={1}
        margin={3.5}
      >
        <TruncatedText letterSpacing="tight" size="lmedium" weight="medium">
          {dappName || 'Unknown connection'}
        </TruncatedText>
      </ColumnWithMargins>
    </Row>
    <Centered>
      <ContextMenu
        css={padding(0, 24, 3, 48)}
        destructiveButtonIndex={0}
        onPressActionSheet={onPressActionSheet}
        options={[
          'Disconnect',
          lang.t('wallet.action.cancel'),
        ]}
        title={`Would you like to disconnect from ${dappName}?`}
      />
    </Centered>
  </Row>
));

WalletConnectListItem.propTypes = {
  dappName: PropTypes.string.isRequired,
  dappIcon: PropTypes.string.isRequired,
  dappUrl: PropTypes.string.isRequired,
  onPressActionSheet: PropTypes.func.isRequired,
};

WalletConnectListItem.height = WalletConnectListItemHeight;

export default WalletConnectListItem;
