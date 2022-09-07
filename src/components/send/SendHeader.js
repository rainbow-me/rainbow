import lang from 'i18n-js';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Keyboard } from 'react-native';
import { useNavigation } from '../../navigation/Navigation';
import { useTheme } from '../../theme/ThemeContext';
import Divider from '../Divider';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { PasteAddressButton } from '../buttons';
import showDeleteContactActionSheet from '../contacts/showDeleteContactActionSheet';
import { AddressField } from '../fields';
import { Row } from '../layout';
import { SheetHandleFixedToTop, SheetTitle } from '../sheet';
import { Label, Text } from '../text';
import { resolveNameOrAddress } from '@/handlers/web3';
import {
  prefetchENSAvatar,
  useClipboard,
  useContacts,
  useDimensions,
  useENSName,
  useUserAccounts,
} from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { abbreviations, showActionSheetWithOptions } from '@/utils';
import { prefetchRainbowProfile } from '@/hooks/useRainbowProfile';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })(
  ({ isSmallPhone, theme: { colors }, isTinyPhone }) => ({
    ...(android
      ? padding.object(0, 19)
      : isTinyPhone
      ? padding.object(23, 15, 10)
      : isSmallPhone
      ? padding.object(11, 19, 15)
      : padding.object(18, 19, 19)),
    backgroundColor: colors.white,
    overflow: 'hidden',
    width: '100%',
  })
);

const AddressFieldLabel = styled(Label).attrs({
  size: 'large',
  weight: 'bold',
})({
  color: ({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.6),
  marginRight: 4,
  opacity: 1,
});

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
  })
)({
  marginRight: 2,
});

const SendSheetTitle = styled(SheetTitle).attrs({
  weight: 'heavy',
})({
  marginBottom: android ? -10 : 0,
  marginTop: android ? 10 : 17,
});

export default function SendHeader({
  hideDivider,
  isValidAddress,
  fromProfile,
  onChangeAddressInput,
  nickname,
  onFocus,
  onPressPaste,
  onRefocusInput,
  recipient,
  recipientFieldRef,
  setContact,
  showAssetList,
}) {
  const { setClipboard } = useClipboard();
  const { onRemoveContact } = useContacts();
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { isSmallPhone, isTinyPhone } = useDimensions();
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  const [hexAddress, setHexAddress] = useState('');
  const { data: ensName } = useENSName(hexAddress);

  useEffect(() => {
    if (hexAddress) {
      prefetchRainbowProfile(hexAddress);
    }
    if (ensName) {
      prefetchENSAvatar(ensName);
    }
  }, [ensName, hexAddress]);

  useEffect(() => {
    if (isValidAddress) {
      resolveAndStoreAddress();
    } else {
      setHexAddress('');
    }

    async function resolveAndStoreAddress() {
      const hex = await resolveNameOrAddress(recipient);
      if (!hex) {
        return;
      }
      setHexAddress(hex);
    }
  }, [isValidAddress, recipient, setHexAddress]);

  const userWallet = useMemo(() => {
    return [...userAccounts, ...watchedAccounts].find(
      account =>
        account.address.toLowerCase() ===
        (hexAddress || recipient)?.toLowerCase()
    );
  }, [recipient, userAccounts, watchedAccounts, hexAddress]);

  const isPreExistingContact = Boolean(nickname);

  const name =
    userWallet?.label ||
    nickname ||
    ensName ||
    abbreviations.formatAddressForDisplay(recipient, 4, 4);

  const handleNavigateToContact = useCallback(() => {
    android && Keyboard.dismiss();
    navigate(Routes.MODAL_SCREEN, {
      additionalPadding: true,
      address: hexAddress,
      contactNickname: nickname || name,
      onRefocusInput,
      type: 'contact_profile',
    });
  }, [navigate, hexAddress, nickname, name, onRefocusInput]);

  const handleOpenContactActionSheet = useCallback(async () => {
    return showActionSheetWithOptions(
      {
        cancelButtonIndex: 3,
        destructiveButtonIndex: 0,
        options: [
          lang.t('contacts.options.delete'), // <-- destructiveButtonIndex
          lang.t('contacts.options.edit'),
          lang.t('wallet.settings.copy_address_capitalized'),
          lang.t('contacts.options.cancel'), // <-- cancelButtonIndex
        ],
      },
      async buttonIndex => {
        if (buttonIndex === 0) {
          showDeleteContactActionSheet({
            address: hexAddress,
            nickname: name,
            onDelete: () => {
              setContact(null);
              onChangeAddressInput(userWallet?.label || ensName || recipient);
            },
            removeContact: onRemoveContact,
          });
        } else if (buttonIndex === 1) {
          handleNavigateToContact();
          onRefocusInput();
        } else if (buttonIndex === 2) {
          setClipboard(hexAddress);
          onRefocusInput();
        }
      }
    );
  }, [
    hexAddress,
    name,
    onRemoveContact,
    setContact,
    onChangeAddressInput,
    userWallet?.label,
    ensName,
    recipient,
    handleNavigateToContact,
    onRefocusInput,
    setClipboard,
  ]);

  const onChange = useCallback(
    text => {
      onChangeAddressInput(text);
      setHexAddress('');
    },
    [onChangeAddressInput]
  );

  return (
    <Fragment>
      <SheetHandleFixedToTop />
      {isTinyPhone ? null : (
        <SendSheetTitle>{lang.t('contacts.send_header')}</SendSheetTitle>
      )}
      <AddressInputContainer
        isSmallPhone={isSmallPhone}
        isTinyPhone={isTinyPhone}
      >
        <AddressFieldLabel>{lang.t('contacts.to_header')}:</AddressFieldLabel>
        <AddressField
          address={recipient}
          autoFocus={!showAssetList}
          editable={!fromProfile}
          isValid={isValidAddress}
          name={name}
          onChangeText={onChange}
          onFocus={onFocus}
          ref={recipientFieldRef}
          testID="send-asset-form-field"
        />
        {isValidAddress && Boolean(hexAddress) && (
          <ButtonPressAnimation
            onPress={
              isPreExistingContact
                ? handleOpenContactActionSheet
                : handleNavigateToContact
            }
          >
            <Text
              align="right"
              color="appleBlue"
              size="large"
              style={{ paddingLeft: 4 }}
              testID={
                isPreExistingContact
                  ? 'edit-contact-button'
                  : 'add-contact-button'
              }
              weight="heavy"
            >
              {isPreExistingContact ? '􀍡' : ` 􀉯 ${lang.t('button.save')}`}
            </Text>
          </ButtonPressAnimation>
        )}
        {isValidAddress && !hexAddress && <LoadingSpinner />}
        {!isValidAddress && <PasteAddressButton onPress={onPressPaste} />}
      </AddressInputContainer>
      {hideDivider && !isTinyPhone ? null : (
        <Divider color={colors.rowDividerExtraLight} flex={0} inset={[0, 19]} />
      )}
    </Fragment>
  );
}
