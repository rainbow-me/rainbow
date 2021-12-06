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
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/ChainLogo' was resolved to '... Remove this comment to see the full error message
import ChainLogo from '../components/ChainLogo';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Spinner' was resolved to '/U... Remove this comment to see the full error message
import Spinner from '../components/Spinner';
import { Alert } from '../components/alerts';
import ButtonPressAnimation from '../components/animations/ButtonPressAnimation';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/contacts/ImageAvatar' was re... Remove this comment to see the full error message
import ImageAvatar from '../components/contacts/ImageAvatar';
import { Centered, Column, Flex, Row } from '../components/layout';
import {
  Sheet,
  SheetActionButton,
  SheetActionButtonRow,
} from '../components/sheet';
import { Text } from '../components/text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/accountInf... Remove this comment to see the full error message
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
import {
  getDappHostname,
  isDappAuthenticated,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/dappNameHa... Remove this comment to see the full error message
} from '@rainbow-me/helpers/dappNameHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
import networkInfo from '@rainbow-me/helpers/networkInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletConn... Remove this comment to see the full error message
import WalletConnectApprovalSheetType from '@rainbow-me/helpers/walletConnectApprovalSheetTypes';
import {
  androidShowNetworksActionSheet,
  NETWORK_MENU_ACTION_KEY_FILTER,
  networksMenuItems,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletConn... Remove this comment to see the full error message
} from '@rainbow-me/helpers/walletConnectNetworks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation, useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'object'.
  const type = params?.type || WalletConnectApprovalSheetType.connect;

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'meta' does not exist on type 'object'.
  const meta = params?.meta || {};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'timeout' does not exist on type 'object'... Remove this comment to see the full error message
  const timeout = params?.timeout;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'callback' does not exist on type 'object... Remove this comment to see the full error message
  const callback = params?.callback;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'receivedTimestamp' does not exist on typ... Remove this comment to see the full error message
  const receivedTimestamp = params?.receivedTimestamp;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'timedOut' does not exist on type 'object... Remove this comment to see the full error message
  const timedOut = params?.timedOut;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'chainId' does not exist on type 'object'... Remove this comment to see the full error message
  const chainId = meta?.chainId || params?.chainId || 1;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'currentNetwork' does not exist on type '... Remove this comment to see the full error message
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
    androidShowNetworksActionSheet(({ network }: any) =>
      setApprovalNetwork(network)
    );
  }, []);

  const handlePressChangeWallet = useCallback(() => {
    type === WalletConnectApprovalSheetType.connect &&
      Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
        currentAccountAddress: approvalAccount.address,
        onChangeWallet: (address: any, wallet: any) => {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Sheet>
      {!Object.keys(meta).length ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Centered height={sheetHeight}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <LoadingSpinner />
        </Centered>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Flex direction="column" height={sheetHeight}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Centered
            direction="column"
            paddingBottom={5}
            paddingHorizontal={19}
            paddingTop={17}
            testID="wc-approval-sheet"
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <DappLogo dappName={dappName || ''} imageUrl={imageUrl} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Centered paddingHorizontal={24}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Row>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.6)}
                  lineHeight={29}
                  size="big"
                  weight="medium"
                >
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Row marginBottom={30} marginTop={15}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                color="appleBlue"
                lineHeight={29}
                size="large"
                weight="heavy"
              >
                {isAuthenticated ? `􀇻 ${formattedDappUrl}` : formattedDappUrl}
              </Text>
            </Row>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Divider color={colors.rowDividerLight} inset={[0, 84]} />
          </Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButtonRow paddingBottom={android ? 20 : 30}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButton
              color={colors.white}
              label="Cancel"
              onPress={handleCancel}
              size="big"
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
              weight="bold"
            />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButton
              color={colors.appleBlue}
              label="Connect"
              onPress={handleConnect}
              size="big"
              testID="wc-connect"
              weight="heavy"
            />
          </SheetActionButtonRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row
            justify="space-between"
            paddingBottom={21}
            paddingHorizontal={24}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <NetworkLabelText>Wallet</NetworkLabelText>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ButtonPressAnimation onPress={handlePressChangeWallet}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Row align="center" marginTop={android ? -10 : 0}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <AvatarWrapper>
                    {approvalAccountInfo.accountImage ? (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <ImageAvatar
                        image={approvalAccountInfo.accountImage}
                        size="smaller"
                      />
                    ) : (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <LabelText numberOfLines={1}>
                    {approvalAccountInfo.accountLabel}
                  </LabelText>
                  {type === WalletConnectApprovalSheetType.connect && (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <SwitchText> 􀁰</SwitchText>
                  )}
                </Row>
              </ButtonPressAnimation>
            </Column>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column align="flex-end">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <NetworkLabelText align="right">Network</NetworkLabelText>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <NetworkSwitcherParent
                activeOpacity={0}
                isMenuPrimaryAction
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
                {...(android ? { onPress: onPressAndroid } : {})}
                menuConfig={{
                  menuItems,
                  menuTitle: 'Available Networks',
                }}
                onPressMenuItem={handleOnPressNetworksMenuItem}
                useActionSheetFallback={false}
                wrapNativeComponent={false}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ButtonPressAnimation>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Row marginTop={android ? -10 : 0}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Centered marginRight={5}>
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <ChainLogo network={approvalNetworkInfo.value} />
                    </Centered>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <LabelText
                      align="right"
                      color={colors.dark}
                      numberOfLines={1}
                    >
                      {approvalNetworkInfo.name}
                    </LabelText>
                    {type === WalletConnectApprovalSheetType.connect &&
                      menuItems.length > 1 && (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
