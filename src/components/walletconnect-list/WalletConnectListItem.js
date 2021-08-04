import analytics from '@segment/analytics-react-native';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import ChainLogo from '../ChainLogo';
import NetworkPill from '../NetworkPill';
import { RequestVendorLogoIcon } from '../coin-icon';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { ContextMenuButton } from '../context-menu';
import { Centered, Column, ColumnWithMargins, Row } from '../layout';
import { Text, TruncatedText } from '../text';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
import {
  dappLogoOverride,
  dappNameOverride,
} from '@rainbow-me/helpers/dappNameHandler';
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import {
  androidShowNetworksActionSheet,
  changeConnectionMenuItems,
  NETWORK_MENU_ACTION_KEY_FILTER,
  networksMenuItems,
} from '@rainbow-me/helpers/walletConnectNetworks';
import {
  useAccountSettings,
  useWalletConnectConnections,
  useWallets,
} from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
export const WalletConnectListItemHeight =
  VendorLogoIconSize + ContainerPadding * 2;

const LabelText = styled(Text).attrs(() => ({
  align: 'center',
  size: 'lmedium',
  weight: 'heavy',
}))`
  margin-bottom: 1;
`;

const networksAvailable = networksMenuItems();

const androidContextMenuActions = ['Switch Wallet', 'Disconnect'];

if (networksAvailable.length > 1) {
  androidContextMenuActions.splice(0, 0, 'Switch Network');
}

const AvatarWrapper = styled(Column)`
  margin-right: 5;
`;

const SessionRow = styled(Row)`
  align-items: center;
  justify-content: space-between;
`;

export default function WalletConnectListItem({
  account,
  chainId,
  dappIcon,
  dappName,
  dappUrl,
  peerId,
  version,
}) {
  const {
    walletConnectDisconnectAllByDappName,
    walletConnectUpdateSessionConnectorByDappName,
    walletConnectV2DisconnectByDappName,
    walletConnectV2UpdateSessionByDappName,
    walletConnectDisconnectAllByPeerId,
    walletConnectUpdateSessionConnectorByPeerId,
  } = useWalletConnectConnections();

  const { goBack } = useNavigation();
  const { colors } = useTheme();
  const { wallets, walletNames } = useWallets();
  const { network } = useAccountSettings();

  const overrideLogo = useMemo(() => {
    return dappLogoOverride(dappUrl);
  }, [dappUrl]);

  const overrideName = useMemo(() => {
    return dappNameOverride(dappUrl);
  }, [dappUrl]);

  const approvalAccountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets, account);
    const approvalAccountInfo = getAccountProfileInfo(
      selectedWallet,
      walletNames,
      network,
      account
    );
    return {
      ...approvalAccountInfo,
      accountLabel:
        approvalAccountInfo.accountENS ||
        approvalAccountInfo.accountName ||
        account,
    };
  }, [walletNames, wallets, network, account]);

  const connectionNetworkInfo = useMemo(() => {
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    return {
      chainId,
      color: colors.networkColors[network],
      name: networkInfo[network]?.name,
      value: network,
    };
  }, [chainId, colors.networkColors]);

  const walletConnectUpdateSession = useCallback(
    (dappName, address, chainId) => {
      const updateSession =
        version === 'v2'
          ? walletConnectV2UpdateSessionByDappName
          : walletConnectUpdateSessionConnectorByPeerId;
      updateSession(dappName, address, chainId);
    },
    [
      version,
      walletConnectUpdateSessionConnectorByPeerId,
      walletConnectV2UpdateSessionByDappName,
    ]
  );

  const walletConnectDisconnect = useCallback(
    dappName => {
      const updateSession =
        version === 'v2'
          ? walletConnectV2DisconnectByDappName
          : walletConnectDisconnectAllByDappName;
      updateSession(dappName);
    },
    [
      version,
      walletConnectDisconnectAllByDappName,
      walletConnectV2DisconnectByDappName,
    ]
  );

  const handlePressChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: account,
      onChangeWallet: address => {
        walletConnectUpdateSession(dappName, address, chainId);
        goBack();
      },
      watchOnly: true,
    });
  }, [account, chainId, dappName, goBack, walletConnectUpdateSession]);

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: androidContextMenuActions,
        showSeparators: true,
        title: overrideName || dappName,
      },
      idx => {
        if (idx === 0 && networksAvailable.length > 1) {
          androidShowNetworksActionSheet(({ chainId }) => {
            walletConnectUpdateSession(dappName, account, chainId);
            walletConnectUpdateSessionConnectorByPeerId(
              peerId,
              account,
              chainId
            );
          });
        } else if ((idx === 0 && networksAvailable.length === 1) || idx === 1) {
          handlePressChangeWallet();
        } else if ((idx === 1 && networksAvailable.length === 1) || idx === 2) {
          walletConnectDisconnect(dappName);
          analytics.track(
            'Manually disconnected from WalletConnect connection',
            {
              dappName,
              dappUrl,
            }
          );
        }
      }
    );
  }, [
    account,
    dappName,
    dappUrl,
    overrideName,
    handlePressChangeWallet,
    walletConnectUpdateSession,
    walletConnectDisconnect,
    peerId,
    walletConnectUpdateSessionConnectorByPeerId,
  ]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'disconnect') {
        walletConnectDisconnect(dappName);
        walletConnectDisconnectAllByPeerId(peerId);
        analytics.track('Manually disconnected from WalletConnect connection', {
          dappName,
          dappUrl,
        });
      } else if (actionKey === 'switch-account') {
        handlePressChangeWallet();
      } else if (actionKey.indexOf(NETWORK_MENU_ACTION_KEY_FILTER) !== -1) {
        const networkValue = actionKey.replace(
          NETWORK_MENU_ACTION_KEY_FILTER,
          ''
        );
        const chainId = ethereumUtils.getChainIdFromNetwork(networkValue);
        walletConnectUpdateSession(dappName, account, chainId);
        walletConnectUpdateSessionConnectorByPeerId(peerId, account, chainId);
      }
    },
    [
      account,
      dappName,
      dappUrl,
      peerId,
      handlePressChangeWallet,
      walletConnectDisconnect,
      walletConnectUpdateSession,
      walletConnectDisconnectAllByPeerId,
      walletConnectUpdateSessionConnectorByPeerId,
    ]
  );

  return (
    <ContextMenuButton
      menuItems={changeConnectionMenuItems()}
      menuTitle={overrideName || dappName}
      onPressAndroid={onPressAndroid}
      onPressMenuItem={handleOnPressMenuItem}
    >
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
          <ColumnWithMargins css={padding(0, 19, 0, 12)} flex={1} margin={5}>
            <Row width="70%">
              <TruncatedText size="lmedium" weight="heavy">
                {overrideName || dappName || 'Unknown Application'}{' '}
              </TruncatedText>
            </Row>

            <SessionRow>
              <Centered>
                <AvatarWrapper>
                  {approvalAccountInfo.accountImage ? (
                    <ImageAvatar
                      image={approvalAccountInfo.accountImage}
                      size="smaller"
                    />
                  ) : (
                    <ContactAvatar
                      color={
                        isNaN(approvalAccountInfo.accountColor)
                          ? colors.skeleton
                          : approvalAccountInfo.accountColor
                      }
                      size="smaller"
                      value={approvalAccountInfo.accountSymbol}
                    />
                  )}
                </AvatarWrapper>
                <TruncatedText
                  size="medium"
                  style={{ color: colors.alpha(colors.blueGreyDark, 0.6) }}
                  weight="bold"
                >
                  {approvalAccountInfo.accountName}
                </TruncatedText>
              </Centered>
            </SessionRow>
          </ColumnWithMargins>
          <NetworkPill mainnet={connectionNetworkInfo.value === 'mainnet'}>
            <ChainLogo network={connectionNetworkInfo.value} />
            <LabelText
              color={
                connectionNetworkInfo.value === 'mainnet'
                  ? colors.alpha(colors.blueGreyDark, 0.5)
                  : colors.alpha(colors.blueGreyDark, 0.8)
              }
              numberOfLines={1}
            >
              {connectionNetworkInfo.name}
            </LabelText>
          </NetworkPill>
        </Row>
      </Row>
    </ContextMenuButton>
  );
}
