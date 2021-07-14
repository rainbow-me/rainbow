import analytics from '@segment/analytics-react-native';
import { capitalize } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import ChainLogo from '../ChainLogo';
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
  isDappAuthenticated,
} from '@rainbow-me/helpers/dappNameHandler';
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
import {
  androidShowNetworksActionSheet,
  changeConnectionMenuItems,
  NETWORK_MENU_ACTION_KEY_FILTER,
} from '@rainbow-me/helpers/walletConnectNetworks';
import {
  useAccountSettings,
  useWalletConnectConnections,
  useWallets,
} from '@rainbow-me/hooks';
import { Navigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
export const WalletConnectListItemHeight =
  VendorLogoIconSize + ContainerPadding * 2;

const LabelText = styled(Text).attrs(() => ({
  lineHeight: 22,
  size: 'lmedium',
  weight: 'semibold',
}))``;

const androidContextMenuActions = [
  'Switch Network',
  'Switch Account',
  'Disconnect',
];

const AvatarWrapper = styled(Column)`
  margin-right: 5;
`;

const SessionRow = styled(Row)`
  justify-content: space-between;
  margin-top: 4;
`;

export default function WalletConnectListItem({
  account,
  chainId,
  dappIcon,
  dappName,
  dappUrl,
}) {
  const {
    walletConnectDisconnectAllByDappName,
    walletConnectUpdateSessionConnectorByDappName,
  } = useWalletConnectConnections();
  const { colors } = useTheme();
  const { wallets, walletNames } = useWallets();
  const { network } = useAccountSettings();

  const isAuthenticated = useMemo(() => {
    return isDappAuthenticated(dappUrl);
  }, [dappUrl]);

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
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    return {
      chainId,
      color: colors.networkColors[network],
      name: capitalize(network?.charAt(0)) + network?.slice(1),
      value: network,
    };
  }, [chainId, colors]);

  const handlePressChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: account,
      onChangeWallet: address => {
        walletConnectUpdateSessionConnectorByDappName(
          dappName,
          address,
          chainId
        );
      },
      watchOnly: true,
    });
  }, [
    account,
    chainId,
    dappName,
    walletConnectUpdateSessionConnectorByDappName,
  ]);

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: androidContextMenuActions,
        showSeparators: true,
        title: dappName,
      },
      idx => {
        if (idx === 0) {
          androidShowNetworksActionSheet(({ chainId }) => {
            walletConnectUpdateSessionConnectorByDappName(
              dappName,
              account,
              chainId
            );
          });
        } else if (idx === 1) {
          handlePressChangeWallet();
        } else if (idx === 2) {
          walletConnectDisconnectAllByDappName(dappName);
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
    walletConnectUpdateSessionConnectorByDappName,
    walletConnectDisconnectAllByDappName,
  ]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'disconnect') {
        walletConnectDisconnectAllByDappName(dappName);
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
        walletConnectUpdateSessionConnectorByDappName(
          dappName,
          account,
          chainId
        );
      }
    },
    [
      account,
      dappName,
      dappUrl,
      handlePressChangeWallet,
      walletConnectDisconnectAllByDappName,
      walletConnectUpdateSessionConnectorByDappName,
    ]
  );

  return (
    <ContextMenuButton
      menuItems={changeConnectionMenuItems()}
      menuTitle={dappName}
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
          <ColumnWithMargins css={padding(0, 19, 1.5, 12)} flex={1} margin={2}>
            <Row width="70%">
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

            <SessionRow>
              <Row>
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
                  style={{ color: colors.alpha(colors.blueGreyDark, 0.5) }}
                  weight="semibold"
                >
                  {approvalAccountInfo.accountName}
                </TruncatedText>
              </Row>
              <Row>
                <Centered marginBottom={0} marginRight={8} marginTop={5}>
                  <ChainLogo network={connectionNetworkInfo.value} />
                </Centered>
                <LabelText
                  color={colors.networkColors[connectionNetworkInfo.value]}
                  numberOfLines={1}
                >
                  {connectionNetworkInfo.name}
                </LabelText>
              </Row>
            </SessionRow>
          </ColumnWithMargins>
        </Row>
      </Row>
    </ContextMenuButton>
  );
}
