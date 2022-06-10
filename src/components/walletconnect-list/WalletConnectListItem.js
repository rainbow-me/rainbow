import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import ChainLogo from '../ChainLogo';
import NetworkPill from '../NetworkPill';
import { RequestVendorLogoIcon } from '../coin-icon';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { ContextMenuButton } from '../context-menu';
import { Centered, ColumnWithMargins, Row } from '../layout';
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
  useRainbowProfile,
  useWalletConnectConnections,
  useWallets,
} from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
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
}))({
  marginBottom: 1,
});

const networksAvailable = networksMenuItems();

const androidContextMenuActions = [
  lang.t('walletconnect.switch_wallet'),
  lang.t('walletconnect.disconnect'),
];

if (networksAvailable.length > 1) {
  androidContextMenuActions.splice(
    0,
    0,
    lang.t('walletconnect.switch_network')
  );
}

const SessionRow = styled(Row)({
  alignItems: 'center',
  justifyContent: 'flex-start',
});

const rowStyle = padding.object(
  ContainerPadding,
  0,
  ContainerPadding + 10,
  ContainerPadding
);

const columnStyle = padding.object(0, 10, 0, 12);

export default function WalletConnectListItem({
  account,
  chainId,
  dappIcon,
  dappName,
  dappUrl,
}) {
  const {
    walletConnectDisconnectAllByDappUrl,
    walletConnectUpdateSessionConnectorByDappUrl,
  } = useWalletConnectConnections();
  const { rainbowProfile } = useRainbowProfile(account);
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
    };
  }, [wallets, walletNames, network, account]);

  const connectionNetworkInfo = useMemo(() => {
    const network = ethereumUtils.getNetworkFromChainId(Number(chainId));
    return {
      chainId,
      color: colors.networkColors[network],
      name: networkInfo[network]?.name,
      value: network,
    };
  }, [chainId, colors]);

  const handlePressChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: account,
      onChangeWallet: address => {
        walletConnectUpdateSessionConnectorByDappUrl(dappUrl, address, chainId);
        goBack();
      },
      watchOnly: true,
    });
  }, [
    account,
    chainId,
    dappUrl,
    goBack,
    walletConnectUpdateSessionConnectorByDappUrl,
  ]);

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
            walletConnectUpdateSessionConnectorByDappUrl(
              dappUrl,
              account,
              chainId
            );
          });
        } else if ((idx === 0 && networksAvailable.length === 1) || idx === 1) {
          handlePressChangeWallet();
        } else if ((idx === 1 && networksAvailable.length === 1) || idx === 2) {
          walletConnectDisconnectAllByDappUrl(dappUrl);
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
    handlePressChangeWallet,
    overrideName,
    walletConnectUpdateSessionConnectorByDappUrl,
    walletConnectDisconnectAllByDappUrl,
  ]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'disconnect') {
        walletConnectDisconnectAllByDappUrl(dappUrl);
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
        walletConnectUpdateSessionConnectorByDappUrl(dappUrl, account, chainId);
      }
    },
    [
      account,
      dappName,
      dappUrl,
      handlePressChangeWallet,
      walletConnectDisconnectAllByDappUrl,
      walletConnectUpdateSessionConnectorByDappUrl,
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
        <Row align="center" flex={1} style={rowStyle}>
          <RequestVendorLogoIcon
            backgroundColor={colors.white}
            dappName={dappName}
            imageUrl={overrideLogo || dappIcon}
            size={VendorLogoIconSize}
          />
          <ColumnWithMargins
            flex={1}
            margin={android ? -4 : 5}
            style={columnStyle}
          >
            <Row width="95%">
              <TruncatedText size="lmedium" weight="heavy">
                {overrideName ||
                  dappName ||
                  lang.t('walletconnect.unknown_application')}
              </TruncatedText>
            </Row>

            <SessionRow>
              <Centered
                style={{
                  paddingLeft: 10,
                }}
              >
                {approvalAccountInfo.accountImage ? (
                  <ImageAvatar
                    image={approvalAccountInfo.accountImage}
                    size="smaller"
                  />
                ) : (
                  <ContactAvatar
                    color={rainbowProfile?.color ?? colors.skeleton}
                    size="smaller"
                    value={rainbowProfile?.emoji}
                  />
                )}
                <TruncatedText
                  size="medium"
                  style={{
                    color: colors.alpha(colors.blueGreyDark, 0.6),
                    paddingLeft: 5,
                    paddingRight: 19,
                    width: '100%',
                  }}
                  weight="bold"
                >
                  {approvalAccountInfo.accountName}
                </TruncatedText>
              </Centered>
            </SessionRow>
          </ColumnWithMargins>
          <ContextMenuButton
            menuItems={networksMenuItems()}
            menuTitle={lang.t('walletconnect.change_network')}
            onPressAndroid={onPressAndroid}
            onPressMenuItem={handleOnPressMenuItem}
          >
            <NetworkPill mainnet={connectionNetworkInfo.value === 'mainnet'}>
              <Row align="center">
                <ChainLogo
                  marginRight={5}
                  network={connectionNetworkInfo.value}
                />
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
              </Row>
            </NetworkPill>
          </ContextMenuButton>
        </Row>
      </Row>
    </ContextMenuButton>
  );
}
