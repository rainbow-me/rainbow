import { useRoute } from '@react-navigation/native';
import { toChecksumAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import { capitalize, get, toLower } from 'lodash';
import React, { Fragment, useCallback, useEffect } from 'react';
import { Keyboard, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import ContactRowInfoButton from '../components/ContactRowInfoButton';
import Divider from '../components/Divider';
import L2Disclaimer from '../components/L2Disclaimer';
import Pill from '../components/Pill';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { ButtonPressAnimation } from '../components/animations';
import { CoinIcon } from '../components/coin-icon';
import RequestVendorLogoIcon from '../components/coin-icon/RequestVendorLogoIcon';
import { ContactAvatar } from '../components/contacts';
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
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@rainbow-me/helpers/emojiHandler';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import {
  isENSAddressFormat,
  isValidDomainFormat,
} from '@rainbow-me/helpers/validators';
import {
  useAccountSettings,
  useAccountTransactions,
  useColorForAsset,
  useContacts,
  useDimensions,
  useENSProfileImages,
  useUserAccounts,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import logger from 'logger';

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }) => ({
  ...(height && { height: height + deviceHeight }),
  ...position.coverAsObject,
}));

const CheckboxContainer = styled(Row)({
  height: 20,
  width: 20,
});

const CheckboxBorder = styled.View(({ checked, color, theme: { colors } }) => ({
  ...(checked ? { backgroundColor: color } : {}),
  borderColor: colors.alpha(colors.blueGreyDark, checked ? 0 : 0.15),
  borderRadius: 7,
  borderWidth: 2,
  height: 20,
  position: 'absolute',
  width: 20,
}));

const CheckboxLabelText = styled(Text).attrs({
  direction: 'column',
  letterSpacing: 'roundedMedium',
  lineHeight: 'looserLoose',
  size: 'lmedium',
  weight: 'bold',
})({
  flexShrink: 1,
});

const Checkmark = styled(Text).attrs(({ checked, theme: { colors } }) => ({
  align: 'center',
  color: checked ? colors.whiteLabel : colors.transparent,
  lineHeight: 'normal',
  size: 'smaller',
  weight: 'bold',
}))({
  width: '100%',
});

const SendButtonWrapper = styled(Column).attrs({
  align: 'center',
})({
  height: 56,
});

export const SendConfirmationSheetHeight = android ? 651 : 540;

const ChevronDown = () => {
  const { colors } = useTheme();
  return (
    <Column
      align="center"
      height={ios ? 34.5 : 30}
      marginTop={android ? -14 : 0}
      position="absolute"
      width={50}
    >
      <Text
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.15)}
        letterSpacing="zero"
        size="larger"
        weight="semibold"
      >
        􀆈
      </Text>
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

const Checkbox = ({ activeColor, checked, id, label, onPress }) => {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    onPress({ checked: !checked, id, label });
  }, [checked, id, label, onPress]);
  return (
    <Column>
      <ButtonPressAnimation
        onPress={handlePress}
        paddingVertical={9.5}
        scaleTo={0.925}
      >
        <RowWithMargins align="center" margin={8}>
          <CheckboxContainer>
            <CheckboxBorder checked={checked} color={activeColor} />
            <Checkmark checked={checked}>􀆅</Checkmark>
          </CheckboxContainer>
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
  const { colors, isDarkMode } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { goBack, navigate, setParams } = useNavigation();
  const {
    height: deviceHeight,
    isSmallPhone,
    isTinyPhone,
    width: deviceWidth,
  } = useDimensions();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const insets = useSafeArea();
  const { contacts } = useContacts();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  useEffect(() => {
    android && Keyboard.dismiss();
  }, []);

  const {
    params: {
      amountDetails,
      asset,
      callback,
      isL2,
      isNft,
      network,
      to,
      toAddress,
    },
  } = useRoute();

  const [
    alreadySentTransactionsTotal,
    setAlreadySentTransactionsTotal,
  ] = useState(0);
  const [
    alreadySentTransactionsCurrentNetwork,
    setAlreadySentTransactionsCurrentNetwork,
  ] = useState(0);

  const { transactions } = useAccountTransactions(true, true);
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { walletNames } = useWallets();
  const isSendingToUserAccount = useMemo(() => {
    const found = userAccounts?.find(account => {
      return toLower(account.address) === toLower(toAddress);
    });
    return !!found;
  }, [toAddress, userAccounts]);

  useEffect(() => {
    if (!isSendingToUserAccount) {
      let sends = 0;
      let sendsCurrentNetwork = 0;
      transactions.forEach(tx => {
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

  const contact = useMemo(() => {
    return get(contacts, `${[toLower(toAddress)]}`);
  }, [contacts, toAddress]);

  const [checkboxes, setCheckboxes] = useState([
    {
      checked: false,
      label: lang.t(
        'wallet.transaction.checkboxes.im_not_sending_to_an_exchange'
      ),
    },
    {
      checked: false,
      label: lang.t(
        'wallet.transaction.checkboxes.has_a_wallet_that_supports',
        {
          networkName: capitalize(network),
        }
      ),
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

  const shouldShowChecks =
    isL2 &&
    !isSendingToUserAccount &&
    alreadySentTransactionsCurrentNetwork < 3;

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
      setIsAuthorizing(false);
    }
  }, [callback, canSubmit]);

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

  const { data: images } = useENSProfileImages(to, {
    enabled: isENSAddressFormat(to),
  });

  const accountImage = profilesEnabled
    ? images?.avatarUrl || existingAccount?.image
    : existingAccount?.image;

  const contentHeight = realSheetHeight - (isL2 ? 50 : 30);
  return (
    <Container
      deviceHeight={deviceHeight}
      height={contentHeight}
      insets={insets}
    >
      {ios && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={contentHeight}
        scrollEnabled={false}
      >
        <SheetTitle>{lang.t('wallet.transaction.sending_title')}</SheetTitle>
        <Column height={contentHeight}>
          <Column padding={24} paddingBottom={android ? 0 : 19}>
            <Row>
              <Column width={deviceWidth - 117}>
                <TruncatedText
                  letterSpacing="roundedTightest"
                  size="bigger"
                  weight="heavy"
                >
                  {isNft ? asset?.name : nativeDisplayAmount}
                </TruncatedText>

                <Row marginTop={android ? -16 : 0} paddingTop={3}>
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
              <Column align="end" flex={1} justify="center">
                <Row>
                  {isNft ? (
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
                    <CoinIcon size={50} {...asset} />
                  )}
                </Row>
              </Column>
            </Row>

            <Row marginVertical={19}>
              <Pill
                borderRadius={15}
                height={30}
                minWidth={39}
                paddingHorizontal={10}
                paddingVertical={5.5}
              >
                <Text
                  align="center"
                  color={colors.blueGreyDark60}
                  letterSpacing="roundedMedium"
                  lineHeight={20}
                  size="large"
                  weight="heavy"
                >
                  {lang.t('account.tx_to_lowercase')}
                </Text>
              </Pill>

              <Column align="end" flex={1}>
                <ChevronDown />
              </Column>
            </Row>
            <Row marginBottom={android ? 15 : 30}>
              <Column flex={1}>
                <Row width={android ? '80%' : '90%'}>
                  <TruncatedText
                    letterSpacing="roundedTight"
                    size="bigger"
                    weight="heavy"
                  >
                    {avatarName}
                  </TruncatedText>
                  <Centered marginTop={android ? 8 : 0}>
                    <ContactRowInfoButton
                      item={{
                        address: toAddress,
                        name: avatarName || address(to, 4, 8),
                      }}
                      network={network}
                      scaleTo={0.75}
                    >
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
                <Row marginTop={android ? -18 : 0} paddingTop={3}>
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
              <Column align="end" justify="center">
                {accountImage ? (
                  <ImageAvatar image={accountImage} size="lmedium" />
                ) : (
                  <ContactAvatar
                    color={avatarColor}
                    size="lmedium"
                    value={avatarValue}
                  />
                )}
              </Column>
            </Row>
            <Divider color={colors.rowDividerExtraLight} inset={[0]} />
          </Column>
          {isL2 && (
            <Fragment>
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
          <Column
            paddingBottom={isL2 ? 20.5 : 11}
            paddingLeft={29}
            paddingRight={24}
          >
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
          <SendButtonWrapper>
            <SendButton
              androidWidth={deviceWidth - 60}
              backgroundColor={color}
              disabled={!canSubmit}
              isAuthorizing={isAuthorizing}
              onLongPress={handleSubmit}
              smallButton={!isTinyPhone && (android || isSmallPhone)}
              testID="send-confirmation-button"
            />
          </SendButtonWrapper>
        </Column>
      </SlackSheet>
    </Container>
  );
}
