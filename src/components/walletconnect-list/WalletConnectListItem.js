import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { RequestVendorLogoIcon } from '../coin-icon';
import { ContextMenuButton } from '../context-menu';
import { Icon } from '../icons';
import { Centered, ColumnWithMargins, Row } from '../layout';
import { Text, TruncatedText } from '../text';
import {
  dappLogoOverride,
  dappNameOverride,
  isDappAuthenticated,
} from '@rainbow-me/helpers/dappNameHandler';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
export const WalletConnectListItemHeight =
  VendorLogoIconSize + ContainerPadding * 2;

const ContextButton = props => (
  <Centered css={padding(16, 19)} {...props}>
    <Icon name="threeDots" />
  </Centered>
);

export default function WalletConnectListItem({
  accounts,
  accountsLabels,
  chainId,
  dappIcon,
  dappName,
  dappUrl,
}) {
  const {
    walletConnectDisconnectAllByDappName,
  } = useWalletConnectConnections();
  const { colors } = useTheme();

  const isAuthenticated = useMemo(() => {
    return isDappAuthenticated(dappUrl);
  }, [dappUrl]);

  const overrideLogo = useMemo(() => {
    return dappLogoOverride(dappUrl);
  }, [dappUrl]);

  const overrideName = useMemo(() => {
    return dappNameOverride(dappUrl);
  }, [dappUrl]);

  const handlePressChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: accounts || '',
      onChangeWallet: () => null,
      watchOnly: true,
    });
  }, [accounts]);

  // <ContextMenu
  //   css={padding(16, 19)}
  //   destructiveButtonIndex={0}
  //   onPressActionSheet={handlePressActionSheet}
  //   options={['Disconnect', lang.t('wallet.action.cancel')]}
  //   title={`Would you like to disconnect from ${dappName}?`}
  // />

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      switch (actionKey) {
        case 'disconnect':
          walletConnectDisconnectAllByDappName(dappName);
          analytics.track(
            'Manually disconnected from WalletConnect connection',
            {
              dappName,
              dappUrl,
            }
          );
          break;
        case 'switch-account':
        default:
          handlePressChangeWallet();
      }
    },
    [
      dappName,
      dappUrl,
      handlePressChangeWallet,
      walletConnectDisconnectAllByDappName,
    ]
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
          imageUrl={overrideLogo || dappIcon}
          size={VendorLogoIconSize}
        />
        <ColumnWithMargins css={padding(0, 19, 1.5, 12)} flex={1} margin={2}>
          <Row>
            <TruncatedText
              letterSpacing="roundedTight"
              size="lmedium"
              weight="bold"
            >
              {overrideName || dappName || 'Unknown Application'}{' '}
            </TruncatedText>
            {isAuthenticated && (
              <Text
                align="center"
                color={colors.appleBlue}
                letterSpacing="roundedMedium"
                size="lmedium"
                weight="bold"
              >
                􀇻
              </Text>
            )}
          </Row>

          <TruncatedText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            size="smedium"
            weight="medium"
          >
            {accountsLabels[accounts]} connected to{' '}
            {ethereumUtils.getNetworkNameFromChainId(chainId)}
          </TruncatedText>
        </ColumnWithMargins>
      </Row>
      <Centered>
        <ContextMenuButton
          menuItems={[
            {
              actionKey: 'disconnect',
              actionTitle: 'Disconnect',
            },
            {
              actionKey: 'switch-network',
              actionTitle: 'Switch Network',
            },
            {
              actionKey: 'switch-account',
              actionTitle: 'Switch Account',
            },
          ]}
          menuTitle={`Change ${dappName} connection?`}
          onPressMenuItem={handleOnPressMenuItem}
        >
          <ContextButton />
        </ContextMenuButton>
      </Centered>
    </Row>
  );
}
