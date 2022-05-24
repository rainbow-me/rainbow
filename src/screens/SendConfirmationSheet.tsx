import { useRoute } from '@react-navigation/native';
import { toChecksumAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import { capitalize, get, isEmpty, toLower } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Keyboard, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import ContactRowInfoButton from '../components/ContactRowInfoButton';
import Divider from '../components/Divider';
import L2Disclaimer from '../components/L2Disclaimer';
import Pill from '../components/Pill';
import TouchableBackdrop from '../components/TouchableBackdrop';
import Callout from '../components/callout/Callout';
import { CoinIcon } from '../components/coin-icon';
import RequestVendorLogoIcon from '../components/coin-icon/RequestVendorLogoIcon';
import { ContactAvatar } from '../components/contacts';
import ImageAvatar from '../components/contacts/ImageAvatar';
import CheckboxField from '../components/fields/CheckboxField';
import { GasSpeedButton } from '../components/gas';
import ENSCircleIcon from '../components/icons/svg/ENSCircleIcon';
import { Centered, Column, Row } from '../components/layout';
import { SendButton } from '../components/send';
import { SheetTitle, SlackSheet } from '../components/sheet';
import { Text as OldText, TruncatedText } from '../components/text';
import { ENSProfile } from '../entities/ens';
import { address } from '../utils/abbreviations';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '../utils/profileUtils';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import { useTheme } from '@rainbow-me/context';
import { Box, Inset, Stack, Text } from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';
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
import { getUniqueTokenType } from '@rainbow-me/utils';
import logger from 'logger';

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }: { deviceHeight: number; height: number }) => ({
  ...(height && { height: height + deviceHeight }),
  ...position.coverAsObject,
}));

const SendButtonWrapper = styled(Column).attrs({
  align: 'center',
})({
  height: 56,
});

export type Checkbox = {
  checked: boolean;
  id:
    | 'clear-profile'
    | 'reverse-record'
    | 'transfer-owner'
    | 'not-sending-to-exchange'
    | 'has-wallet-that-supports';
  label: string;
};

const hasClearProfileInfo = (ensProfile?: ENSProfile) =>
  isEmpty(ensProfile?.data?.records);
const doesNamePointToRecipient = (
  ensProfile?: ENSProfile,
  recipientAddress?: string
) =>
  ensProfile?.data?.primary?.address.toLowerCase() ===
  recipientAddress?.toLowerCase();
const doesAccountControlName = (ensProfile?: ENSProfile) => ensProfile?.isOwner;

const gasOffset = 120;
const checkboxOffset = 44;

export function getSheetHeight({
  asset,
  ensProfile,
  shouldShowChecks,
  isL2,
  toAddress,
}: {
  asset?: UniqueAsset;
  ensProfile?: ENSProfile;
  shouldShowChecks: boolean;
  isL2: boolean;
  toAddress: string;
}) {
  let height = android ? 488 : 377;
  if (shouldShowChecks) height = height + 104;
  if (isL2) height = height + 59;
  if (asset && getUniqueTokenType(asset) === 'ENS') {
    height = height + gasOffset;
    if (!hasClearProfileInfo(ensProfile)) {
      height = height + checkboxOffset;
    }
    if (!doesNamePointToRecipient(ensProfile, toAddress)) {
      height = height + checkboxOffset;
    }
    if (doesAccountControlName(ensProfile)) {
      height = height + checkboxOffset;
    }
  }
  return height;
}

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
      <OldText
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.15)}
        letterSpacing="zero"
        size="larger"
        weight="semibold"
      >
        􀆈
      </OldText>
      <OldText
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.09)}
        letterSpacing="zero"
        size="larger"
        style={{ top: -13 }}
        weight="semibold"
      >
        􀆈
      </OldText>
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
      ensProfile,
      isL2,
      isNft,
      network,
      to,
      toAddress,
    },
  } = useRoute<any>();

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
    // @ts-expect-error From JavaScript hook
    const found = userAccounts?.find(account => {
      return toLower(account.address) === toLower(toAddress);
    });
    return !!found;
  }, [toAddress, userAccounts]);

  useEffect(() => {
    if (!isSendingToUserAccount) {
      let sends = 0;
      let sendsCurrentNetwork = 0;
      // @ts-expect-error From JavaScript hook
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

  const uniqueTokenType = getUniqueTokenType(asset);
  const isENS = uniqueTokenType === 'ENS';

  const [checkboxes, setCheckboxes] = useState<Checkbox[]>(
    isENS
      ? ([
          !hasClearProfileInfo(ensProfile) && {
            checked: false,
            id: 'clear-profile',
            label: 'Clear profile information',
          },
          !doesNamePointToRecipient(ensProfile, toAddress) && {
            checked: false,
            id: 'reverse-record',
            label: 'Point this name to the recipient’s wallet address',
          },
          doesAccountControlName(ensProfile) && {
            checked: false,
            id: 'transfer-owner',
            label: 'Transfer control to the recipient',
          },
        ].filter(Boolean) as Checkbox[])
      : [
          {
            checked: false,
            id: 'not-sending-to-exchange',
            label: lang.t(
              'wallet.transaction.checkboxes.im_not_sending_to_an_exchange'
            ),
          },
          {
            checked: false,
            id: 'has-wallet-that-supports',
            label: lang.t(
              'wallet.transaction.checkboxes.has_a_wallet_that_supports',
              {
                networkName: capitalize(network),
              }
            ),
          },
        ]
  );

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

  const { data: images } = useENSProfileImages(to, {
    enabled: isENSAddressFormat(to),
  });

  const accountImage = profilesEnabled
    ? images?.avatarUrl || existingAccount?.image
    : existingAccount?.image;

  let contentHeight =
    getSheetHeight({
      ensProfile,
      isL2,
      shouldShowChecks,
      toAddress,
    }) - 30;
  if (shouldShowChecks) contentHeight = contentHeight + 150;
  if (isL2) contentHeight = contentHeight + 60;
  if (isENS) {
    contentHeight =
      contentHeight + checkboxes.length * checkboxOffset + gasOffset;
  }

  return (
    <Container
      deviceHeight={deviceHeight}
      height={contentHeight}
      insets={insets}
    >
      {ios && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}

      {/* @ts-expect-error JavaScript component */}
      <SlackSheet
        additionalTopPadding={android}
        contentHeight={contentHeight}
        scrollEnabled={false}
      >
        <SheetTitle>{lang.t('wallet.transaction.sending_title')}</SheetTitle>
        <Column height={contentHeight}>
          <Column padding={24}>
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
                  <OldText
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
                  </OldText>
                </Row>
              </Column>
              <Column align="end" flex={1} justify="center">
                <Row>
                  {isNft ? (
                    // @ts-expect-error JavaScript component
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
                <OldText
                  align="center"
                  color={colors.blueGreyDark60}
                  letterSpacing="roundedMedium"
                  lineHeight={20}
                  size="large"
                  weight="heavy"
                >
                  {lang.t('account.tx_to_lowercase')}
                </OldText>
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
                      <OldText
                        color={colors.alpha(
                          colors.blueGreyDark,
                          isDarkMode ? 0.5 : 0.6
                        )}
                        lineHeight={31}
                        size="larger"
                        weight="heavy"
                      >
                        {' 􀍡'}
                      </OldText>
                    </ContactRowInfoButton>
                  </Centered>
                </Row>
                <Row marginTop={android ? -18 : 0} paddingTop={3}>
                  <OldText
                    color={colors.alpha(colors.blueGreyDark, 0.6)}
                    size="lmedium"
                    weight="bold"
                  >
                    {isSendingToUserAccount
                      ? `You own this wallet`
                      : alreadySentTransactionsTotal === 0
                      ? `First time send`
                      : `${alreadySentTransactionsTotal} previous sends`}
                  </OldText>
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
            {/* @ts-expect-error JavaScript component */}
            <Divider color={colors.rowDividerExtraLight} inset={[0]} />
          </Column>
          {(isL2 || isENS || shouldShowChecks) && (
            <Inset bottom="30px" horizontal="19px">
              <Stack space="19px">
                {isL2 && (
                  <Fragment>
                    {/* @ts-expect-error JavaScript component */}
                    <L2Disclaimer
                      assetType={asset.type}
                      colors={colors}
                      hideDivider
                      marginBottom={0}
                      marginHorizontal={0}
                      onPress={handleL2DisclaimerPress}
                      prominent
                      sending
                      symbol={asset.symbol}
                    />
                  </Fragment>
                )}
                {isENS && (
                  <Callout
                    after={
                      <Text color="secondary30" weight="heavy">
                        􀅵
                      </Text>
                    }
                    before={
                      <Box
                        background="accent"
                        borderRadius={20}
                        shadow="12px heavy accent"
                        style={{ height: 20, width: 20 }}
                      >
                        <ENSCircleIcon height={20} width={20} />
                      </Box>
                    }
                  >
                    ENS configuration options
                  </Callout>
                )}
                {(isENS || shouldShowChecks) && (
                  <Inset horizontal="10px">
                    <Stack space="24px">
                      {checkboxes.map((check, i) => (
                        <CheckboxField
                          color={color}
                          isChecked={check.checked}
                          key={`check_${i}`}
                          label={check.label}
                          onPress={() =>
                            handleCheckbox({
                              checked: !check.checked,
                              id: i,
                              label: check.label,
                            })
                          }
                        />
                      ))}
                    </Stack>
                  </Inset>
                )}
              </Stack>
            </Inset>
          )}
          <SendButtonWrapper>
            {/* @ts-expect-error JavaScript component */}
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
          {isENS && (
            <GasSpeedButton
              asset={{ color: color }}
              currentNetwork="mainnet"
              testID="testinggas"
              theme="light"
              validateGasParams={null}
            />
          )}
        </Column>
      </SlackSheet>
    </Container>
  );
}
