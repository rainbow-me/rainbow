import { distanceInWordsStrict } from 'date-fns';
import { pickBy, values } from 'lodash';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withWalletConnectConnections } from '../../hoc';
import { walletConnectDisconnectAll } from '../../model/walletconnect';
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
      getValidWalletConnectors,
      removeWalletConnectorByDapp,
    }) => (buttonIndex) => {
      if (buttonIndex === 0) {
        const validSessions = getValidWalletConnectors();
        const dappSessions = values(pickBy(validSessions, (session) => session.dappName === dappName));

        walletConnectDisconnectAll(dappSessions).then(() => {
          removeWalletConnectorByDapp(dappName);
        });
      }
    },
  }),
  onlyUpdateForKeys(['expires']),
);

const WalletConnectListItem = enhance(({
  dappName,
  expires,
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
        <Text color="blueGreyLighter" size="medium">
          Expires in {distanceInWordsStrict(Date.now(), expires)}
        </Text>
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
  expires: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onPressActionSheet: PropTypes.func.isRequired,
};

WalletConnectListItem.height = WalletConnectListItemHeight;

export default WalletConnectListItem;
