import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers } from 'recompact';
import { RequestVendorLogoIcon } from '../coin-icon';
import ContextMenu from '../ContextMenu';
import { withWalletConnectConnections } from '../../hoc';
import {
  Centered,
  ColumnWithMargins,
  FlexItem,
  Row,
} from '../layout';
import { padding } from '../../styles';
import { TruncatedText } from '../text';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
const WalletConnectListItemHeight = VendorLogoIconSize + (ContainerPadding * 2);

const enhance = compose(
  withWalletConnectConnections,
  withHandlers({
    onPressActionSheet: ({
      dappName,
      dappUrl,
      walletConnectDisconnectAllByDappName,
    }) => (buttonIndex) => {
      if (buttonIndex === 0) {
        walletConnectDisconnectAllByDappName(dappName);
        analytics.track('Manually disconnected from WalletConnect connection', {
          dappName,
          dappUrl,
        });
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
        <TruncatedText letterSpacing="tighter" size="lmedium" weight="medium">
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
  dappIcon: PropTypes.string.isRequired,
  dappName: PropTypes.string.isRequired,
  dappUrl: PropTypes.string.isRequired,
  onPressActionSheet: PropTypes.func.isRequired,
};

WalletConnectListItem.height = WalletConnectListItemHeight;

export default WalletConnectListItem;
