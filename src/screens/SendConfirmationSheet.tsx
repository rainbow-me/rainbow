import { useRoute } from '@react-navigation/native';
import { toChecksumAddress } from 'ethereumjs-util';
import { capitalize, get, toLower } from 'lodash';
import React, { Fragment, useCallback, useEffect } from 'react';
import { Keyboard, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/ContactRowInfoButton' was re... Remove this comment to see the full error message
import ContactRowInfoButton from '../components/ContactRowInfoButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/L2Disclaimer' was resolved t... Remove this comment to see the full error message
import L2Disclaimer from '../components/L2Disclaimer';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Pill' was resolved to '/User... Remove this comment to see the full error message
import Pill from '../components/Pill';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/TouchableBackdrop' was resol... Remove this comment to see the full error message
import TouchableBackdrop from '../components/TouchableBackdrop';
import { ButtonPressAnimation } from '../components/animations';
import { CoinIcon } from '../components/coin-icon';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/coin-icon/RequestVendorLogoI... Remove this comment to see the full error message
import RequestVendorLogoIcon from '../components/coin-icon/RequestVendorLogoIcon';
import { ContactAvatar } from '../components/contacts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/contacts/ImageAvatar' was re... Remove this comment to see the full error message
import ImageAvatar from '../components/contacts/ImageAvatar';
import { Centered, Column, Row, RowWithMargins } from '../components/layout';
import { SendButton } from '../components/send';
import { SheetTitle, SlackSheet } from '../components/sheet';
import { Text, TruncatedText } from '../components/text';
import { address } from '../utils/abbreviations';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '../utils/profileUtils';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/emojiHandl... Remove this comment to see the full error message
} from '@rainbow-me/helpers/emojiHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
import { isValidDomainFormat } from '@rainbow-me/helpers/validators';
import {
  useAccountSettings,
  useAccountTransactions,
  useColorForAsset,
  useContacts,
  useDimensions,
  useUserAccounts,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const CheckboxContainer = styled(Row)`
  height: 20;
  width: 20;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const CheckboxBorder = styled.View`
  ${({ checked, color }: any) => checked && `background-color: ${color}`};
  border-radius: 7;
  border-color: ${({ checked, theme: { colors } }: any) =>
    colors.alpha(colors.blueGreyDark, checked ? 0 : 0.15)};
  border-width: 2;
  height: 20;
  position: absolute;
  width: 20;
`;

const CheckboxLabelText = styled(Text).attrs({
  direction: 'column',
  letterSpacing: 'roundedMedium',
  lineHeight: 'looserLoose',
  size: 'lmedium',
  weight: 'bold',
})`
  flex-shrink: 1;
`;

const Checkmark = styled(Text).attrs(({ checked, theme: { colors } }) => ({
  align: 'center',
  color: checked ? colors.whiteLabel : colors.transparent,
  lineHeight: 'normal',
  size: 'smaller',
  weight: 'bold',
}))`
  width: 100%;
`;

const SendButtonWrapper = styled(Column).attrs({
  align: 'center',
})`
  height: 56;
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
export const SendConfirmationSheetHeight = android ? 651 : 540;

const ChevronDown = () => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column
      align="center"
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      height={ios ? 34.5 : 30}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      marginTop={android ? -14 : 0}
      position="absolute"
      width={50}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.15)}
        letterSpacing="zero"
        size="larger"
        weight="semibold"
      >
        􀆈
      </Text>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.09)}
        letterSpacing="zero"
        size="larger"
        style={{ top: -13 }}
        weight="semibold"
      >
        􀆈
      </Text>
    </Column>
  );
};

const Checkbox = ({ activeColor, checked, id, label, onPress }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    onPress({ checked: !checked, id, label });
  }, [checked, id, label, onPress]);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        onPress={handlePress}
        paddingVertical={9.5}
        scaleTo={0.925}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins align="center" margin={8}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CheckboxContainer>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CheckboxBorder checked={checked} color={activeColor} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Checkmark checked={checked}>􀆅</Checkmark>
          </CheckboxContainer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CheckboxLabelText
            color={
              (checked && activeColor) || colors.alpha(colors.blueGreyDark, 0.8)
            }
          >
            {label}
          </CheckboxLabelText>
        </RowWithMargins>
      </ButtonPressAnimation>
    </Column>
  );
};

export default function SendConfirmationSheet() {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { goBack, navigate, setParams } = useNavigation();
  const {
    height: deviceHeight,
    isSmallPhone,
    isTinyPhone,
    width: deviceWidth,
  } = useDimensions();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const insets = useSafeArea();
  const { contacts } = useContacts();

  useEffect(() => {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
  }, []);

  const {
    params: {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'amountDetails' does not exist on type 'R... Remove this comment to see the full error message
      amountDetails,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'asset' does not exist on type 'Readonly<... Remove this comment to see the full error message
      asset,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'callback' does not exist on type 'Readon... Remove this comment to see the full error message
      callback,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'isL2' does not exist on type 'Readonly<o... Remove this comment to see the full error message
      isL2,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'isNft' does not exist on type 'Readonly<... Remove this comment to see the full error message
      isNft,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type 'Readonl... Remove this comment to see the full error message
      network,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'to' does not exist on type 'Readonly<obj... Remove this comment to see the full error message
      to,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'toAddress' does not exist on type 'Reado... Remove this comment to see the full error message
      toAddress,
    },
  } = useRoute();

  const [
    alreadySentTransactionsTotal,
    setAlreadySentTransactionsTotal,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  ] = useState(0);
  const [
    alreadySentTransactionsCurrentNetwork,
    setAlreadySentTransactionsCurrentNetwork,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  ] = useState(0);

  const { transactions } = useAccountTransactions(true, true);
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { walletNames } = useWallets();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const isSendingToUserAccount = useMemo(() => {
    const found = userAccounts?.find((account: any) => {
      return toLower(account.address) === toLower(toAddress);
    });
    return !!found;
  }, [toAddress, userAccounts]);

  useEffect(() => {
    if (!isSendingToUserAccount) {
      let sends = 0;
      let sendsCurrentNetwork = 0;
      transactions.forEach((tx: any) => {
        if (toLower(tx.to) === toLower(toAddress)) {
          sends++;
          if (tx.network === network) {
            sendsCurrentNetwork++;
          }
        }
      });
      if (sends > 0) {
        setAlreadySentTransactionsTotal(sends);
        if (sendsCurrentNetwork > 0) {
          setAlreadySentTransactionsCurrentNetwork(sendsCurrentNetwork);
        }
      }
    }
  }, [isSendingToUserAccount, network, toAddress, transactions]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const contact = useMemo(() => {
    return get(contacts, `${[toLower(to)]}`);
  }, [contacts, to]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
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

  const shouldShowChecks =
    isL2 &&
    !isSendingToUserAccount &&
    alreadySentTransactionsCurrentNetwork < 3;

  useEffect(() => {
    setParams({ shouldShowChecks });
  }, [setParams, shouldShowChecks]);

  const canSubmit =
    !shouldShowChecks ||
    checkboxes.filter((check: any) => check.checked === false).length === 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      setIsAuthorizing(true);
      await callback();
    } catch (e) {
      logger.sentry('TX submit failed', e);
      setIsAuthorizing(false);
    }
  }, [callback, canSubmit]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const existingAccount = useMemo(() => {
    let existingAcct = null;
    if (toAddress) {
      const allAccounts = [...userAccounts, ...watchedAccounts].filter(
        acct => acct.visible
      );
      for (const account of allAccounts) {
        if (
          toChecksumAddress(account.address) === toChecksumAddress(toAddress)
        ) {
          existingAcct = account;
          break;
        }
      }
    }
    return existingAcct;
  }, [toAddress, userAccounts, watchedAccounts]);

  const avatarName =
    removeFirstEmojiFromString(existingAccount?.label || contact?.nickname) ||
    (isValidDomainFormat(to)
      ? to
      : walletNames?.[to]
      ? walletNames[to]
      : address(to, 4, 6));

  const avatarValue =
    returnStringFirstEmoji(existingAccount?.label) ||
    contact?.nickname ||
    addressHashedEmoji(toAddress);

  const avatarColor =
    existingAccount?.color ||
    contact?.color ||
    addressHashedColorIndex(toAddress);

  let realSheetHeight = !shouldShowChecks
    ? SendConfirmationSheetHeight - 150
    : SendConfirmationSheetHeight;

  if (!isL2) {
    realSheetHeight -= 80;
  }

  const accountImage = existingAccount?.image;

  const contentHeight = realSheetHeight - (isL2 ? 50 : 30);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      deviceHeight={deviceHeight}
      height={contentHeight}
      insets={insets}
    >
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <StatusBar barStyle="light-content" />}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <TouchableBackdrop onPress={goBack} />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        additionalTopPadding={android}
        contentHeight={contentHeight}
        scrollEnabled={false}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetTitle>Sending</SheetTitle>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column height={contentHeight}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column padding={24} paddingBottom={android ? 0 : 19}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Row>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Column width={deviceWidth - 117}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <TruncatedText
                  letterSpacing="roundedTightest"
                  size="bigger"
                  weight="heavy"
                >
                  {isNft ? asset?.name : nativeDisplayAmount}
                </TruncatedText>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Row marginTop={android ? -16 : 0} paddingTop={3}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Text
                    color={
                      isNft ? colors.alpha(colors.blueGreyDark, 0.6) : color
                    }
                    letterSpacing="roundedMedium"
                    size="lmedium"
                    weight={isNft ? 'bold' : 'heavy'}
                  >
                    {isNft
                      ? asset.familyName
                      : `${amountDetails.assetAmount} ${asset.symbol}`}
                  </Text>
                </Row>
              </Column>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Column align="end" flex={1} justify="center">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Row>
                  {isNft ? (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <RequestVendorLogoIcon
                      backgroundColor={asset.background || colors.lightestGrey}
                      badgeXPosition={-7}
                      badgeYPosition={0}
                      borderRadius={10}
                      imageUrl={asset.image_thumbnail_url || asset.image_url}
                      network={asset.network}
                      showLargeShadow
                      size={50}
                    />
                  ) : (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <CoinIcon size={50} {...asset} />
                  )}
                </Row>
              </Column>
            </Row>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Row marginVertical={19}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Pill
                borderRadius={15}
                height={30}
                minWidth={39}
                paddingHorizontal={10}
                paddingVertical={5.5}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  align="center"
                  color={colors.blueGreyDark60}
                  letterSpacing="roundedMedium"
                  lineHeight={20}
                  size="large"
                  weight="heavy"
                >
                  to
                </Text>
              </Pill>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Column align="end" flex={1}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ChevronDown />
              </Column>
            </Row>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Row marginBottom={android ? 15 : 30}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Column flex={1}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Row width={android ? '80%' : '90%'}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <TruncatedText
                    letterSpacing="roundedTight"
                    size="bigger"
                    weight="heavy"
                  >
                    {avatarName}
                  </TruncatedText>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Centered marginTop={android ? 8 : 0}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <ContactRowInfoButton
                      item={{
                        address: toAddress,
                        name: avatarName || address(to, 4, 8),
                      }}
                      network={network}
                      scaleTo={0.75}
                    >
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <Text
                        color={colors.alpha(
                          colors.blueGreyDark,
                          isDarkMode ? 0.5 : 0.6
                        )}
                        lineHeight={31}
                        size="larger"
                        weight="heavy"
                      >
                        {' 􀍡'}
                      </Text>
                    </ContactRowInfoButton>
                  </Centered>
                </Row>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Row marginTop={android ? -18 : 0} paddingTop={3}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Text
                    color={colors.alpha(colors.blueGreyDark, 0.6)}
                    size="lmedium"
                    weight="bold"
                  >
                    {isSendingToUserAccount
                      ? `You own this wallet`
                      : alreadySentTransactionsTotal === 0
                      ? `First time send`
                      : `${alreadySentTransactionsTotal} previous sends`}
                  </Text>
                </Row>
              </Column>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Column align="end" justify="center">
                {accountImage ? (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <ImageAvatar image={accountImage} size="lmedium" />
                ) : (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <ContactAvatar
                    color={avatarColor}
                    size="lmedium"
                    value={avatarValue}
                  />
                )}
              </Column>
            </Row>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Divider color={colors.rowDividerExtraLight} inset={[0]} />
          </Column>
          {isL2 && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Fragment>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <L2Disclaimer
                assetType={asset.type}
                colors={colors}
                hideDivider
                marginBottom={9.5}
                onPress={handleL2DisclaimerPress}
                prominent
                sending
                symbol={asset.symbol}
              />
            </Fragment>
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column
            paddingBottom={isL2 ? 20.5 : 11}
            paddingLeft={29}
            paddingRight={24}
          >
            {shouldShowChecks &&
              checkboxes.map((check: any, i: any) => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SendButtonWrapper>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SendButton
              androidWidth={deviceWidth - 60}
              backgroundColor={color}
              disabled={!canSubmit}
              isAuthorizing={isAuthorizing}
              onLongPress={handleSubmit}
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
              smallButton={!isTinyPhone && (android || isSmallPhone)}
              testID="send-confirmation-button"
            />
          </SendButtonWrapper>
        </Column>
      </SlackSheet>
    </Container>
  );
}
