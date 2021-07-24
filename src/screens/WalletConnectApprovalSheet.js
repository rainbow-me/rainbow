import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { capitalize } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import ChainLogo from '../components/ChainLogo';
import Divider from '../components/Divider';
import { Alert } from '../components/alerts';
import ButtonPressAnimation from '../components/animations/ButtonPressAnimation';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import ImageAvatar from '../components/contacts/ImageAvatar';
import { Centered, Column, Row } from '../components/layout';
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
  color: colors.blueGreyDark,
  lineHeight: 17,
  size: 'lmedium',
}))`
  margin-bottom: 4;
`;

const LabelText = styled(Text).attrs(() => ({
  lineHeight: 22,
  size: 'large',
  weight: 'heavy',
}))``;

const AvatarWrapper = styled(Column)`
  margin-right: 5;
`;

const SwitchText = styled(Text).attrs(() => ({
  fontSize: 18,
  lineHeight: 22,
  weight: 'heavy',
}))`
  margin-left: 5;
`;

export default function WalletConnectApprovalSheet() {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const { network, accountAddress } = useAccountSettings();
  const { selectedWallet, walletNames } = useWallets();
  const handled = useRef(false);

  const [scam, setScam] = useState(false);
  const [approvalNetwork, setApprovalNetwork] = useState(network);
  const [approvalAccount, setApprovalAccount] = useState({
    address: accountAddress,
    wallet: selectedWallet,
  });

  const type = params?.type || WalletConnectApprovalSheetType.connect;
  const chainId = params?.chainId || 1;
  const meta = params?.meta || {};
  const { dappName, dappUrl, imageUrl } = meta;
  const callback = params?.callback;

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
      name: capitalize(value?.charAt(0)) + value?.slice(1),
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
              approvalAccount.address
            ),
          300
        );
      }
    },
    [approvalAccount.address, callback, approvalNetworkInfo]
  );

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
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: approvalAccount.address,
      onChangeWallet: (address, wallet) =>
        setApprovalAccount({ address, wallet }),
      watchOnly: true,
    });
  }, [approvalAccount.address]);

  useEffect(() => {
    if (scam) {
      handleCancel();
    }
  }, [handleCancel, scam]);

  return (
    <Sheet hideHandle>
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
            >
              <Text color="dark" size="big" weight="bold">
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
          <Text color="appleBlue" lineHeight={29} size="large" weight="bold">
            {isAuthenticated ? `􀇻 ${formattedDappUrl}` : formattedDappUrl}
          </Text>
        </Row>
        <Divider color={colors.rowDividerLight} inset={[0, 84]} />
      </Centered>
      <SheetActionButtonRow>
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
          weight="bold"
        />
      </SheetActionButtonRow>
      <SheetActionButtonRow>
        <Column>
          <NetworkLabelText>Wallet</NetworkLabelText>
          <ButtonPressAnimation onPress={handlePressChangeWallet}>
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
              <LabelText numberOfLines={1}>
                {approvalAccountInfo.accountLabel}
              </LabelText>
              <SwitchText>􀁰</SwitchText>
            </Row>
          </ButtonPressAnimation>
        </Column>
        <Column align="flex-end">
          <NetworkLabelText>Network</NetworkLabelText>
          <ContextMenuButton
            activeOpacity={0}
            isMenuPrimaryAction
            {...(android ? { onPress: onPressAndroid } : {})}
            menuConfig={{
              menuItems: networksMenuItems(),
              menuTitle: 'Available Networks',
            }}
            onPressMenuItem={handleOnPressNetworksMenuItem}
            useActionSheetFallback={false}
            wrapNativeComponent={false}
          >
            <ButtonPressAnimation>
              <Row>
                <Centered marginBottom={0} marginRight={8} marginTop={5}>
                  <ChainLogo network={approvalNetworkInfo.value} />
                </Centered>
                <LabelText
                  color={colors.networkColors[approvalNetwork]}
                  numberOfLines={1}
                >
                  {approvalNetworkInfo.name}
                </LabelText>
                <SwitchText color={colors.networkColors[approvalNetwork]}>
                  􀁰
                </SwitchText>
              </Row>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </Column>
      </SheetActionButtonRow>
    </Sheet>
  );
}
