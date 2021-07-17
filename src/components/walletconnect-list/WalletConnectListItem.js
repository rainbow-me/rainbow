import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { RequestVendorLogoIcon } from '../coin-icon';
import { ContextMenu } from '../context-menu';
import { Centered, ColumnWithMargins, Row } from '../layout';
import { Text, TruncatedText } from '../text';
import {
  dappLogoOverride,
  dappNameOverride,
  isDappAuthenticated,
} from '@rainbow-me/helpers/dappNameHandler';
import networkInfo from '@rainbow-me/helpers/networkInfo';
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

const ContainerPadding = 15;
const VendorLogoIconSize = 50;
export const WalletConnectListItemHeight =
  VendorLogoIconSize + ContainerPadding * 2;

const LabelText = styled(Text).attrs(() => ({
  lineHeight: 22,
  size: 'lmedium',
  weight: 'regular',
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
  version,
}) {
  const {
    walletConnectDisconnectAllByDappName,
    walletConnectUpdateSessionConnectorByDappName,
    walletConnectV2DisconnectByDappName,
    walletConnectV2UpdateSessionByDappName,
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

  const approvalAccountInfo = useMemo(() => {
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
  }, [walletNames, network, account, selectedWallet]);

  const connectionNetworkInfo = useMemo(() => {
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    return {
      chainId,
      color: networkInfo[network]?.color,
      name: capitalize(network?.charAt(0)) + network?.slice(1),
      value: network,
    };
  }, [chainId]);

  const walletConnectUpdateSession = useCallback(
    (dappName, address, chainId) => {
      const updateSession =
        version === 'v2'
          ? walletConnectV2UpdateSessionByDappName
          : walletConnectUpdateSessionConnectorByDappName;
      updateSession(dappName, address, chainId);
    },
    [
      version,
      walletConnectUpdateSessionConnectorByDappName,
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
      },
      watchOnly: true,
    });
  }, [account, chainId, dappName, walletConnectUpdateSession]);

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: androidContextMenuActions,
        showSeparators: true,
        title: `Change ${dappName} connection?`,
      },
      idx => {
        if (idx === 0) {
          androidShowNetworksActionSheet(({ chainId }) => {
            walletConnectUpdateSession(dappName, account, chainId);
          });
        } else if (idx === 1) {
          handlePressChangeWallet();
        } else if (idx === 2) {
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
    handlePressChangeWallet,
    walletConnectUpdateSession,
    walletConnectDisconnect,
  ]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'disconnect') {
        walletConnectDisconnect(dappName);
        analytics.track('Manually disconnected from WalletConnect connection', {
          dappName,
          dappUrl,
        });
      } else if (actionKey === 'switch-account') {
        handlePressChangeWallet();
        //
      } else if (actionKey.indexOf(NETWORK_MENU_ACTION_KEY_FILTER) !== -1) {
        const networkValue = actionKey.replace(
          NETWORK_MENU_ACTION_KEY_FILTER,
          ''
        );
        const chainId = ethereumUtils.getChainIdFromNetwork(networkValue);
        walletConnectUpdateSession(dappName, account, chainId);
      }
    },
    [
      account,
      dappName,
      dappUrl,
      handlePressChangeWallet,
      walletConnectDisconnect,
      walletConnectUpdateSession,
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
