import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { RequestVendorLogoIcon } from '../coin-icon';
import { ContextMenu } from '../context-menu';
import { Centered, ColumnWithMargins, Row } from '../layout';
import { TruncatedText } from '../text';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { colors, padding } from '@rainbow-me/styles';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
export const WalletConnectListItemHeight =
  VendorLogoIconSize + ContainerPadding * 2;

export default function WalletConnectListItem({ dappIcon, dappName, dappUrl }) {
  const {
    walletConnectDisconnectAllByDappName,
  } = useWalletConnectConnections();

  const handlePressActionSheet = useCallback(
    buttonIndex => {
      if (buttonIndex === 0) {
        walletConnectDisconnectAllByDappName(dappName);
        analytics.track('Manually disconnected from WalletConnect connection', {
          dappName,
          dappUrl,
        });
      }
    },
    [dappName, dappUrl, walletConnectDisconnectAllByDappName]
  );

  return (
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
          onPressActionSheet={handlePressActionSheet}
          options={['Disconnect', lang.t('wallet.action.cancel')]}
          title={`Would you like to disconnect from ${dappName}?`}
        />
      </Centered>
    </Row>
  );
}
