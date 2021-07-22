import { useRoute } from '@react-navigation/native';
import { capitalize, get, toLower } from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import ContactRowInfoButton from '../components/ContactRowInfoButton';
import L2Disclaimer from '../components/L2Disclaimer';
import Pill from '../components/Pill';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { ButtonPressAnimation } from '../components/animations';
import { CoinIcon } from '../components/coin-icon';
import RequestVendorLogoIcon from '../components/coin-icon/RequestVendorLogoIcon';
import { ContactAvatar } from '../components/contacts';
import { Centered, Column, Row } from '../components/layout';
import { SendButton } from '../components/send';
import { SheetDivider, SheetTitle, SlackSheet } from '../components/sheet';
import { Text, TruncatedText } from '../components/text';
import { address } from '../utils/abbreviations';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '../utils/defaultProfileUtils';
import { isL2Network } from '@rainbow-me/handlers/web3';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import { isENSAddressFormat } from '@rainbow-me/helpers/validators';
import {
  useAccountSettings,
  useAccountTransactions,
  useColorForAsset,
  useContacts,
  useDimensions,
  useUserAccounts,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import logger from 'logger';

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

export const SendConfirmationSheetHeight = android
  ? 600 - getSoftMenuBarHeight()
  : 594;

const ChevronDown = () => {
  const { colors } = useTheme();
  return (
    <Column align="center" width={50}>
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.09)}
        size="larger"
        style={{ top: -5, transform: [{ rotate: '90deg' }] }}
        weight="600"
      >
        􀰫
      </Text>
    </Column>
  );
};

const Checkbox = ({ id, checked, label, onPress, activeColor }) => {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    onPress({ checked: !checked, id, label });
  }, [checked, id, label, onPress]);
  return (
    <Column marginBottom={20}>
      <ButtonPressAnimation onPress={handlePress}>
        <Row>
          <Text
            color={(checked && activeColor) || colors.blueGreyDark80}
            size="lmedium"
            weight="700"
          >
            {checked ? '􀃳 ' : '􀂒 '}
          </Text>
          <Text
            color={(checked && activeColor) || colors.blueGreyDark80}
            size="lmedium"
            weight="700"
          >
            {label}
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Column>
  );
};

export default function SendConfirmationSheet() {
  const { colors, isDarkMode } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { goBack, navigate, setParams } = useNavigation();
  const { height: deviceHeight, isSmallPhone, isTinyPhone } = useDimensions();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const insets = useSafeArea();
  const { contacts } = useContacts();
  const { wallets, walletNames } = useWallets();

  const {
    params: { asset, amountDetails, callback, isNft, network, to, toAddress },
  } = useRoute();

  const [alreadySentTransactions, setAlreadySentTransactions] = useState(0);

  const { transactions } = useAccountTransactions(true, true);
  const { userAccounts } = useUserAccounts();
  const isSendingToUserAccount = useMemo(() => {
    const found = userAccounts?.find(account => {
      return toLower(account.address) === toLower(toAddress);
    });
    return !!found;
  }, [toAddress, userAccounts]);

  useEffect(() => {
    if (!isSendingToUserAccount) {
      let sends = 0;
      transactions.forEach(tx => {
        if (toLower(tx.to) === toLower(toAddress)) {
          sends++;
        }
      });
      if (sends > 0) {
        setAlreadySentTransactions(sends);
      }
    }
  }, [
    isSendingToUserAccount,
    setAlreadySentTransactions,
    toAddress,
    transactions,
  ]);

  const contact = useMemo(() => {
    return get(contacts, `${[toLower(to)]}`);
  }, [contacts, to]);

  const [checkboxes, setCheckboxes] = useState([
    { checked: false, label: 'I’m not sending to an exchange' },
    {
      checked: false,
      label: `The person I’m sending to has a wallet that supports ${capitalize(
        network
      )}`,
    },
  ]);

  const handleCheckbox = useCallback(
    checkbox => {
      const newCheckboxesState = [...checkboxes];
      newCheckboxesState[checkbox.id] = checkbox;
      setCheckboxes(newCheckboxesState);
    },
    [checkboxes]
  );

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: asset.type,
    });
  }, [asset.type, navigate]);

  const nativeDisplayAmount = useMemo(
    () =>
      convertAmountToNativeDisplay(amountDetails.nativeAmount, nativeCurrency),
    [amountDetails.nativeAmount, nativeCurrency]
  );

  let color = useColorForAsset({
    address: asset.mainnet_address || asset.address,
  });

  if (isNft) {
    color = colors.appleBlue;
  }

  const isL2 = useMemo(() => {
    return isL2Network(network);
  }, [network]);

  const shouldShowChecks =
    isL2 && !isSendingToUserAccount && alreadySentTransactions < 3;

  useEffect(() => {
    setParams({ shouldShowChecks });
  }, [setParams, shouldShowChecks]);

  const canSubmit =
    !shouldShowChecks ||
    checkboxes.filter(check => check.checked === false).length === 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      setIsAuthorizing(true);
      await callback();
    } catch (e) {
      logger.sentry('TX submit failed', e);
    } finally {
      setIsAuthorizing(false);
    }
  }, [callback, canSubmit]);

  const accountProfile = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets, toAddress);
    const approvalAccountInfo = getAccountProfileInfo(
      selectedWallet,
      network,
      walletNames,
      toAddress
    );
    return {
      ...approvalAccountInfo,
    };
  }, [wallets, toAddress, network, walletNames]);

  const avatarName =
    contact?.nickname ||
    accountProfile?.accountName ||
    (isENSAddressFormat(to) ? to : address(to, 4, 6));

  const avatarValue =
    contact?.nickname ||
    accountProfile?.accountSymbol ||
    addressHashedEmoji(toAddress);

  const avatarColor =
    contact?.color ||
    accountProfile?.accountColor ||
    addressHashedColorIndex(toAddress);

  let realSheetHeight = !shouldShowChecks
    ? SendConfirmationSheetHeight - 150
    : SendConfirmationSheetHeight;

  if (!isL2) {
    realSheetHeight -= 80;
  }

  const contentHeight = realSheetHeight - (isL2 ? 50 : 30);
  return (
    <Container
      deviceHeight={deviceHeight}
      height={realSheetHeight}
      insets={insets}
    >
      {ios && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={realSheetHeight}
        scrollEnabled={false}
      >
        <SheetTitle>Sending</SheetTitle>
        <Column height={contentHeight}>
          <Column padding={24}>
            <Row>
              <Column width="80%">
                <TruncatedText size="big" weight="bold">
                  {isNft ? asset?.name : nativeDisplayAmount}
                </TruncatedText>

                <Row paddingTop={4}>
                  <Text
                    color={
                      isNft ? colors.alpha(colors.blueGreyDark, 0.6) : color
                    }
                    size="lmedium"
                    weight="700"
                  >
                    {isNft
                      ? asset.familyName
                      : `${amountDetails.assetAmount} ${asset.symbol}`}
                  </Text>
                </Row>
              </Column>
              <Column align="end" flex={1} justify="end">
                <Row>
                  {isNft ? (
                    <RequestVendorLogoIcon
                      backgroundColor={asset.background || colors.lightestGrey}
                      badgeXPosition={-19}
                      badgeYPosition={-16}
                      borderRadius={10}
                      imageUrl={asset.image_thumbnail_url || asset.image_url}
                      network={asset.network}
                      showLargeShadow
                      size={50}
                    />
                  ) : (
                    <CoinIcon
                      badgeXPosition={-15}
                      badgeYPosition={-15}
                      size={50}
                      {...asset}
                    />
                  )}
                </Row>
              </Column>
            </Row>

            <Row marginBottom={22} marginTop={22}>
              <Column>
                <Pill borderRadius={20} paddingHorizontal={10}>
                  <Column padding={5}>
                    <Text
                      color={colors.blueGreyDark60}
                      size="large"
                      weight="bold"
                    >
                      to
                    </Text>
                  </Column>
                </Pill>
              </Column>
              <Column align="end" flex={1} justify="end">
                <ChevronDown />
              </Column>
            </Row>

            <Row marginBottom={30}>
              <Column flex={1}>
                <Row width="70%">
                  <Column>
                    <TruncatedText size="big" weight="bold">
                      {avatarName}
                    </TruncatedText>
                  </Column>
                  <Column>
                    <ContactRowInfoButton
                      item={{
                        address: toAddress,
                        name: avatarName || address(to, 4, 8),
                      }}
                      network={network}
                    />
                  </Column>
                </Row>
                <Row paddingTop={4}>
                  <Text
                    color={colors.alpha(colors.blueGreyDark, 0.6)}
                    size="lmedium"
                    weight="700"
                  >
                    {isSendingToUserAccount
                      ? `You own this account`
                      : alreadySentTransactions === 0
                      ? `First time send`
                      : `${alreadySentTransactions} previous sends`}
                  </Text>
                </Row>
              </Column>
              <Column align="end" justify="end">
                <ContactAvatar
                  color={avatarColor}
                  size="lmedium"
                  value={avatarValue}
                />
              </Column>
            </Row>
          </Column>
          <SheetDivider />
          {isL2 && (
            <L2Disclaimer
              assetType={asset.type}
              colors={colors}
              onPress={handleL2DisclaimerPress}
              sending
              symbol={asset.symbol}
            />
          )}
          <Column padding={24} paddingTop={19}>
            {shouldShowChecks &&
              checkboxes.map((check, i) => (
                <Checkbox
                  activeColor={color}
                  checked={check.checked}
                  id={i}
                  key={`check_${i}`}
                  label={check.label}
                  onPress={handleCheckbox}
                />
              ))}
          </Column>
          <Column align="center" flex={1} justify="end">
            <SendButton
              backgroundColor={
                canSubmit
                  ? color
                  : isDarkMode
                  ? colors.darkGrey
                  : colors.lightGrey
              }
              disabled={!canSubmit}
              isAuthorizing={isAuthorizing}
              onLongPress={handleSubmit}
              smallButton={!isTinyPhone && (android || isSmallPhone)}
              testID="send-confirmation-button"
            />
          </Column>
        </Column>
      </SlackSheet>
    </Container>
  );
}
