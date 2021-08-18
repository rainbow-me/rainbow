import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, InteractionManager } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import ChainLogo from '../components/ChainLogo';
import Divider from '../components/Divider';
import Spinner from '../components/Spinner';
import { Alert } from '../components/alerts';
import ButtonPressAnimation from '../components/animations/ButtonPressAnimation';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import ImageAvatar from '../components/contacts/ImageAvatar';
import { Centered, Column, Flex, Row } from '../components/layout';
import {
  Sheet,
  SheetActionButton,
  SheetActionButtonRow,
} from '../components/sheet';
import { Text } from '../components/text';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
import {
  getDappHostname,
  isDappAuthenticated,
} from '@rainbow-me/helpers/dappNameHandler';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import WalletConnectApprovalSheetType from '@rainbow-me/helpers/walletConnectApprovalSheetTypes';
import {
  androidShowNetworksActionSheet,
  NETWORK_MENU_ACTION_KEY_FILTER,
  networksMenuItems,
} from '@rainbow-me/helpers/walletConnectNetworks';
import { useAccountSettings, useWallets } from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
    size: android ? 40 : 'large',
  })
)``;

const DappLogo = styled(RequestVendorLogoIcon).attrs(
  ({ theme: { colors } }) => ({
    backgroundColor: colors.transparent,
    borderRadius: 18,
    showLargeShadow: true,
    size: 60,
  })
)`
  margin-bottom: 24;
`;

const NetworkLabelText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'semibold',
}))`
  margin-bottom: 4;
`;

const LabelText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: 'large',
  weight: 'heavy',
}))``;

const AvatarWrapper = styled(Column)`
  margin-right: 5;
  margin-top: 1;
`;

const SwitchText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: 'large',
  weight: 'heavy',
}))``;

export default function WalletConnectApprovalSheet() {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const { network, accountAddress } = useAccountSettings();
  const { navigate } = useNavigation();
  const { selectedWallet, walletNames } = useWallets();
  const handled = useRef(false);
  const [scam, setScam] = useState(false);
  const [approvalAccount, setApprovalAccount] = useState({
    address: accountAddress,
    wallet: selectedWallet,
  });

  const type = params?.type || WalletConnectApprovalSheetType.connect;

  const meta = params?.meta || {};
  const timeout = params?.timeout;
  const callback = params?.callback;
  const receivedTimestamp = params?.receivedTimestamp;
  const timedOut = params?.timedOut;
  const chainId = meta?.chainId || params?.chainId || 1;
  const currentNetwork = params?.currentNetwork;
  const [approvalNetwork, setApprovalNetwork] = useState(
    currentNetwork || network
  );

  const { dappName, dappUrl, dappScheme, imageUrl, peerId } = meta;

  const checkIfScam = useCallback(
    async dappUrl => {
      const isScam = await ethereumUtils.checkIfUrlIsAScam(dappUrl);
      if (isScam) {
        Alert({
          buttons: [
            {
              text: 'Proceed Anyway',
            },
            {
              onPress: () => setScam(true),
              style: 'cancel',
              text: 'Ignore this request',
            },
          ],
          message:
            'We found this website in a list of malicious crypto scams.\n\n We recommend you to ignore this request and stop using this website immediately',
          title: ' 🚨 Heads up! 🚨',
        });
      }
    },
    [setScam]
  );

  useEffect(() => {
    return () => {
      clearTimeout(timeout);
    };
  }, [timeout]);

  const isAuthenticated = useMemo(() => {
    return isDappAuthenticated(dappUrl);
  }, [dappUrl]);

  const formattedDappUrl = useMemo(() => {
    return getDappHostname(dappUrl);
  }, [dappUrl]);

  const approvalAccountInfo = useMemo(() => {
    const approvalAccountInfo = getAccountProfileInfo(
      approvalAccount.wallet,
      walletNames,
      approvalNetwork,
      approvalAccount.address
    );
    return {
      ...approvalAccountInfo,
      accountLabel:
        approvalAccountInfo.accountENS ||
        approvalAccountInfo.accountName ||
        approvalAccount.address,
    };
  }, [
    walletNames,
    approvalNetwork,
    approvalAccount.wallet,
    approvalAccount.address,
  ]);

  const approvalNetworkInfo = useMemo(() => {
    const value = networkInfo[approvalNetwork]?.value;
    return {
      chainId: ethereumUtils.getChainIdFromNetwork(approvalNetwork),
      color: networkInfo[approvalNetwork]?.color,
      name: networkInfo[approvalNetwork]?.name,
      value,
    };
  }, [approvalNetwork]);

  const handleOnPressNetworksMenuItem = useCallback(
    ({ nativeEvent }) =>
      setApprovalNetwork(
        nativeEvent.actionKey?.replace(NETWORK_MENU_ACTION_KEY_FILTER, '')
      ),
    [setApprovalNetwork]
  );

  const handleSuccess = useCallback(
    (success = false) => {
      if (callback) {
        setTimeout(
          () =>
            callback(
              success,
              approvalNetworkInfo.chainId,
              approvalAccount.address,
              peerId,
              dappScheme,
              dappName,
              dappUrl
            ),
          300
        );
      }
    },
    [
      approvalAccount.address,
      callback,
      approvalNetworkInfo,
      peerId,
      dappScheme,
      dappName,
      dappUrl,
    ]
  );

  useEffect(() => {
    if (chainId && type === WalletConnectApprovalSheetType.connect) {
      const network = ethereumUtils.getNetworkFromChainId(Number(chainId));
      setApprovalNetwork(network);
    }
  }, [chainId, type]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      analytics.track('Shown Walletconnect session request');
      type === WalletConnectApprovalSheetType.connect && checkIfScam(dappUrl);
    });
    // Reject if the modal is dismissed
    return () => {
      if (!handled.current) {
        handleSuccess(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(() => {
    handled.current = true;
    goBack();
    handleSuccess(true);
  }, [handleSuccess, goBack]);

  const handleCancel = useCallback(() => {
    handled.current = true;
    goBack();
    handleSuccess(false);
  }, [handleSuccess, goBack]);

  const onPressAndroid = useCallback(() => {
    androidShowNetworksActionSheet(({ network }) =>
      setApprovalNetwork(network)
    );
  }, []);

  const handlePressChangeWallet = useCallback(() => {
    type === WalletConnectApprovalSheetType.connect &&
      Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
        currentAccountAddress: approvalAccount.address,
        onChangeWallet: (address, wallet) => {
          setApprovalAccount({ address, wallet });
          goBack();
        },
        watchOnly: true,
      });
  }, [approvalAccount.address, goBack, type]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      analytics.track('Received wc connection', {
        dappName,
        dappUrl,
        waitingTime: (Date.now() - receivedTimestamp) / 1000,
      });
    });
  }, [dappName, dappUrl, receivedTimestamp]);

  useEffect(() => {
    if (!timedOut) return;
    goBack();
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'failed_wc_connection',
    });
    return;
  }, [goBack, navigate, timedOut]);

  useEffect(() => {
    if (scam) {
      handleCancel();
    }
  }, [handleCancel, scam]);

  const menuItems = useMemo(() => networksMenuItems(), []);
  const NetworkSwitcherParent =
    type === WalletConnectApprovalSheetType.connect && menuItems.length > 1
      ? ContextMenuButton
      : React.Fragment;

  const sheetHeight =
    type === WalletConnectApprovalSheetType.connect ? 408 : 438;

  return (
    <Sheet>
      {!Object.keys(meta).length ? (
        <Centered height={sheetHeight}>
          <LoadingSpinner />
        </Centered>
      ) : (
        <Flex direction="column" height={sheetHeight}>
          <Centered
            direction="column"
            paddingBottom={5}
            paddingHorizontal={19}
            paddingTop={17}
            testID="wc-approval-sheet"
          >
            <DappLogo dappName={dappName || ''} imageUrl={imageUrl} />
            <Centered paddingHorizontal={24}>
              <Row>
                <Text
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.6)}
                  lineHeight={29}
                  size="big"
                  weight="medium"
                >
                  <Text color="dark" size="big" weight="heavy">
                    {dappName}
                  </Text>{' '}
                  {type === WalletConnectApprovalSheetType.connect
                    ? `wants to connect to your wallet`
                    : `wants to connect to the ${ethereumUtils.getNetworkNameFromChainId(
                        chainId
                      )} network`}
                </Text>
              </Row>
            </Centered>
            <Row marginBottom={30} marginTop={15}>
              <Text
                color="appleBlue"
                lineHeight={29}
                size="large"
                weight="heavy"
              >
                {isAuthenticated ? `􀇻 ${formattedDappUrl}` : formattedDappUrl}
              </Text>
            </Row>
            <Divider color={colors.rowDividerLight} inset={[0, 84]} />
          </Centered>
          <SheetActionButtonRow paddingBottom={android ? 20 : 30}>
            <SheetActionButton
              color={colors.white}
              label="Cancel"
              onPress={handleCancel}
              size="big"
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
              weight="bold"
            />
            <SheetActionButton
              color={colors.appleBlue}
              label="Connect"
              onPress={handleConnect}
              size="big"
              testID="wc-connect"
              weight="heavy"
            />
          </SheetActionButtonRow>
          <Row
            justify="space-between"
            paddingBottom={21}
            paddingHorizontal={24}
          >
            <Column>
              <NetworkLabelText>Wallet</NetworkLabelText>
              <ButtonPressAnimation onPress={handlePressChangeWallet}>
                <Row align="center" marginTop={android ? -10 : 0}>
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
                  <LabelText numberOfLines={1}>
                    {approvalAccountInfo.accountLabel}
                  </LabelText>
                  {type === WalletConnectApprovalSheetType.connect && (
                    <SwitchText> 􀁰</SwitchText>
                  )}
                </Row>
              </ButtonPressAnimation>
            </Column>
            <Column align="flex-end">
              <NetworkLabelText align="right">Network</NetworkLabelText>
              <NetworkSwitcherParent
                activeOpacity={0}
                isMenuPrimaryAction
                {...(android ? { onPress: onPressAndroid } : {})}
                menuConfig={{
                  menuItems,
                  menuTitle: 'Available Networks',
                }}
                onPressMenuItem={handleOnPressNetworksMenuItem}
                useActionSheetFallback={false}
                wrapNativeComponent={false}
              >
                <ButtonPressAnimation>
                  <Row marginTop={android ? -10 : 0}>
                    <Centered marginRight={5}>
                      <ChainLogo network={approvalNetworkInfo.value} />
                    </Centered>
                    <LabelText
                      align="right"
                      color={colors.dark}
                      numberOfLines={1}
                    >
                      {approvalNetworkInfo.name}
                    </LabelText>
                    {type === WalletConnectApprovalSheetType.connect &&
                      menuItems.length > 1 && (
                        <SwitchText align="right"> 􀁰</SwitchText>
                      )}
                  </Row>
                </ButtonPressAnimation>
              </NetworkSwitcherParent>
            </Column>
          </Row>
        </Flex>
      )}
    </Sheet>
  );
}
