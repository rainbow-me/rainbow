import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers } from 'recompact';
import { withWalletConnectConnections } from '../../hoc';
import { RequestVendorLogoIcon } from '../coin-icon';
import { ContextMenu } from '../context-menu';
import { Centered, ColumnWithMargins, Row } from '../layout';
import { TruncatedText } from '../text';
import { colors, padding } from '@rainbow-me/styles';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
const WalletConnectListItemHeight = VendorLogoIconSize + ContainerPadding * 2;

const enhance = compose(
  withWalletConnectConnections,
  withHandlers({
    onPressActionSheet: ({
      dappName,
      dappUrl,
      walletConnectDisconnectAllByDappName,
    }) => buttonIndex => {
      if (buttonIndex === 0) {
        walletConnectDisconnectAllByDappName(dappName);
        analytics.track('Manually disconnected from WalletConnect connection', {
          dappName,
          dappUrl,
        });
      }
    },
  })
);

const WalletConnectListItem = enhance(
  ({ dappName, dappIcon, onPressActionSheet }) => (
    <Row align="center" height={WalletConnectListItemHeight}>
      <Row
        align="center"
        css={padding(ContainerPadding, 0, ContainerPadding, ContainerPadding)}
        flex={1}
      >
        <RequestVendorLogoIcon
          backgroundColor={colors.white}
          dappName={dappName}
          imageUrl={dappIcon}
          size={VendorLogoIconSize}
        />
        <ColumnWithMargins css={padding(0, 19, 1.5, 12)} flex={1} margin={2}>
          <TruncatedText
            letterSpacing="roundedTight"
            size="lmedium"
            weight="bold"
          >
            {dappName || 'Unknown Application'}
          </TruncatedText>
          <TruncatedText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            size="smedium"
            weight="medium"
          >
            Connected
          </TruncatedText>
        </ColumnWithMargins>
      </Row>
      <Centered>
        <ContextMenu
          css={padding(16, 19)}
          destructiveButtonIndex={0}
          onPressActionSheet={onPressActionSheet}
          options={['Disconnect', lang.t('wallet.action.cancel')]}
          title={`Would you like to disconnect from ${dappName}?`}
        />
      </Centered>
    </Row>
  )
);

WalletConnectListItem.propTypes = {
  dappIcon: PropTypes.string.isRequired,
  dappName: PropTypes.string.isRequired,
  dappUrl: PropTypes.string.isRequired,
  onPressActionSheet: PropTypes.func.isRequired,
};

WalletConnectListItem.height = WalletConnectListItemHeight;

export default WalletConnectListItem;
