import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, View } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
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
import {
  getDappHostname,
  isDappAuthenticated,
} from '@rainbow-me/helpers/dappNameHandler';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import { useAccountProfile, useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
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

const NetworkText = styled(Text).attrs(() => ({
  lineHeight: 22,
  size: 'large',
  weight: 'heavy',
}))``;

const AvatarWrapper = styled(View).attrs(() => ({}))`
  margin-right: 5;
`;

const SwitchText = styled(Text).attrs(() => ({
  fontSize: 18,
  lineHeight: 22,
  weight: 'heavy',
}))`
  margin-left: 5;
`;

export const SavingsSheetEmptyHeight = 313;
export const SavingsSheetHeight = android ? 424 : 352;

export default function WalletConnectApprovalSheet() {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const [scam, setScam] = useState(false);
  const handled = useRef(false);
  const meta = params?.meta || {};
  const { dappName, dappUrl, imageUrl } = meta;
  const callback = params?.callback;

  const {
    accountSymbol,
    accountColor,
    accountImage,
    accountENS,
    accountName,
  } = useAccountProfile();
  const { network } = useAccountSettings();
  const { navigate } = useNavigation();

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

  const handleSuccess = useCallback(
    (success = false) => {
      if (callback) {
        setTimeout(() => callback(success), 300);
      }
    },
    [callback]
  );

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      analytics.track('Shown Walletconnect session request');
      checkIfScam(dappUrl);
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

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

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
              wants to connect to your wallet
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
                {accountImage ? (
                  <ImageAvatar image={accountImage} size="smaller" />
                ) : (
                  <ContactAvatar
                    color={isNaN(accountColor) ? colors.skeleton : accountColor}
                    size="smaller"
                    value={accountSymbol}
                  />
                )}
              </AvatarWrapper>
              <NetworkText numberOfLines={1}>
                {accountENS || accountName}
              </NetworkText>
              <SwitchText>􀁰</SwitchText>
            </Row>
          </ButtonPressAnimation>
        </Column>
        <Column align="flex-end">
          <NetworkLabelText>Network</NetworkLabelText>
          <ContextMenuButton
            activeOpacity={0}
            isMenuPrimaryAction
            menuConfig={{
              menuItems: [
                {
                  actionKey: 'action-key',
                  actionTitle: 'Action #1',
                },
              ],
              menuTitle: 'Context Menu Example',
            }}
            onPressMenuItem={({ nativeEvent }) => {
              alert(`${nativeEvent.actionKey} was pressed`);
            }}
            useActionSheetFallback={false}
            wrapNativeComponent={false}
          >
            <ButtonPressAnimation>
              <Row>
                <AvatarWrapper>
                  <ImageAvatar image={accountImage} size="smaller" />
                </AvatarWrapper>
                <NetworkText color={get(networkInfo[network], 'color')}>
                  {get(networkInfo[network], 'name')}
                </NetworkText>
                <SwitchText color={get(networkInfo[network], 'color')}>
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
