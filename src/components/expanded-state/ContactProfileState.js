import lang from 'i18n-js';
import React, { useCallback, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useRecoilValue } from 'recoil';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';
import { abbreviations, magicMemo, profileUtils } from '../../utils';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { showDeleteContactActionSheet } from '../contacts';
import CopyTooltip from '../copy-tooltip';
import { Centered } from '../layout';
import { Text, TruncatedAddress, TruncatedENS } from '../text';
import { ProfileAvatarButton, ProfileModal, ProfileNameInput } from './profile';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import { AccentColorProvider, Box } from '@rainbow-me/design-system';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@rainbow-me/helpers/emojiHandler';
import { accentColorAtom } from '@rainbow-me/helpers/ens';
import { isValidDomainFormat } from '@rainbow-me/helpers/validators';
import { useAccountSettings, useContacts } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { borders, margin, padding } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const AddressAbbreviation = styled(TruncatedAddress).attrs(
  ({ theme: { colors } }) => ({
    align: 'center',
    color: colors.blueGreyDark,
    firstSectionLength: abbreviations.defaultNumCharsPerSection,
    size: 'lmedium',
    truncationLength: 4,
    weight: 'regular',
  })
)({
  ...margin.object(9, 0, 5),
  opacity: 0.6,
  width: '100%',
});

const ENSAbbreviation = styled(TruncatedENS).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark,
  size: 'lmedium',
  truncationLength: 18,
  weight: 'regular',
}))({
  ...margin.object(9, 0, 5),
  opacity: 0.6,
  width: '100%',
});

const Spacer = styled.View({
  height: 19,
});

const SubmitButton = styled(Button).attrs(
  ({ theme: { colors }, value, color }) => ({
    backgroundColor:
      value.length > 0
        ? typeof color === 'string'
          ? color
          : colors.avatarBackgrounds[color] || colors.appleBlue
        : undefined,
    disabled: !value.length > 0,
    showShadow: true,
    size: 'small',
  })
)({
  height: 43,
  width: 215,
});

const SubmitButtonLabel = styled(Text).attrs(({ value }) => ({
  color: value.length > 0 ? 'whiteLabel' : 'white',
  size: 'lmedium',
  weight: 'bold',
}))({
  marginBottom: 1.5,
});

const centerdStyles = padding.object(24, 25);
const bottomStyles = padding.object(8, 9);

const ContactProfileState = ({
  address,
  avatarUrl,
  contact,
  emoji: avatarEmoji,
  nickname,
}) => {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const contactNickname = contact?.nickname || nickname;
  const { goBack } = useNavigation();
  const { onAddOrUpdateContacts, onRemoveContact } = useContacts();
  const { isDarkMode, colors } = useTheme();

  const accentColor = useRecoilValue(accentColorAtom);

  const [color, setColor] = useState(accentColor || 0);
  const [value, setValue] = useState(
    removeFirstEmojiFromString(contactNickname)
  );
  const [emoji, setEmoji] = useState(returnStringFirstEmoji(contactNickname));
  const inputRef = useRef(null);
  const { network } = useAccountSettings();

  const handleAddContact = useCallback(() => {
    const nickname = (emoji ? `${emoji} ${value}` : value).trim();
    if (value.length > 0 || color !== accentColor) {
      onAddOrUpdateContacts(address, nickname, color, network);
      goBack();
    }
    android && Keyboard.dismiss();
  }, [
    accentColor,
    address,
    color,
    emoji,
    goBack,
    network,
    onAddOrUpdateContacts,
    value,
  ]);

  const handleDeleteContact = useCallback(() => {
    showDeleteContactActionSheet({
      address,
      nickname: value,
      onDelete: goBack,
      removeContact: onRemoveContact,
    });
    android && Keyboard.dismiss();
  }, [address, goBack, onRemoveContact, value]);

  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  const isContact = Boolean(contact);

  const handleChangeAvatar = useCallback(() => {
    const prevAvatarIndex = profileUtils.avatars.findIndex(
      avatar => avatar.emoji === emoji
    );
    const nextAvatarIndex = (prevAvatarIndex + 1) % profileUtils.avatars.length;
    setColor(profileUtils.avatars[nextAvatarIndex]?.colorIndex);
    setEmoji(profileUtils.avatars[nextAvatarIndex]?.emoji);
  }, [emoji, setColor]);

  const avatarSize = 65;

  return (
    <ProfileModal onPressBackdrop={handleAddContact}>
      <Centered direction="column" style={centerdStyles}>
        {profilesEnabled ? (
          <ShadowStack
            {...borders.buildCircleAsObject(avatarSize)}
            shadows={[
              [0, 6, 10, colors.shadow, 0.12],
              [0, 2, 5, colors.shadow, 0.08],
            ]}
          >
            {avatarUrl ? (
              <Box
                as={ImgixImage}
                borderRadius={avatarSize / 2}
                height={{ custom: avatarSize }}
                source={{ uri: avatarUrl }}
                width={{ custom: avatarSize }}
              />
            ) : (
              <AccentColorProvider color={color}>
                <Box
                  alignItems="center"
                  background="accent"
                  borderRadius={avatarSize / 2}
                  height={{ custom: avatarSize }}
                  justifyContent="center"
                  width={{ custom: avatarSize }}
                >
                  <Text size="biggest">{avatarEmoji || ''}</Text>
                </Box>
              </AccentColorProvider>
            )}
          </ShadowStack>
        ) : (
          <ProfileAvatarButton
            changeAvatar={handleChangeAvatar}
            color={color}
            marginBottom={0}
            radiusAndroid={32}
            testID="contact-profile-avatar-button"
            value={emoji || value}
          />
        )}
        <Spacer />
        <ProfileNameInput
          onChange={setValue}
          onSubmitEditing={handleAddContact}
          placeholder="Name"
          ref={inputRef}
          selectionColor={colors.avatarBackgrounds[color]}
          testID="contact-profile-name-input"
          value={value}
        />
        <CopyTooltip
          onHide={handleTriggerFocusInput}
          textToCopy={address}
          tooltipText={lang.t('wallet.settings.copy_address_capitalized')}
        >
          {isValidDomainFormat(address) ? (
            <ENSAbbreviation ens={address} />
          ) : (
            <AddressAbbreviation address={address} />
          )}
        </CopyTooltip>
        <Centered paddingVertical={19} width={93}>
          <Divider inset={false} />
        </Centered>
        <SubmitButton
          color={color}
          isDarkMode={isDarkMode}
          onPress={handleAddContact}
          testID="contact-profile-add-button"
          value={value}
        >
          <SubmitButtonLabel value={value}>
            {isContact ? lang.t('button.done') : lang.t('contacts.options.add')}
          </SubmitButtonLabel>
        </SubmitButton>
        <ButtonPressAnimation
          marginTop={11}
          onPress={
            isContact
              ? handleDeleteContact
              : () => {
                  goBack();
                  android && Keyboard.dismiss();
                }
          }
        >
          <Centered
            backgroundColor={colors.white}
            style={bottomStyles}
            testID="contact-profile-cancel-button"
          >
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.4)}
              size="lmedium"
              weight="regular"
            >
              {isContact
                ? lang.t('contacts.options.delete')
                : lang.t('contacts.options.cancel')}
            </Text>
          </Centered>
        </ButtonPressAnimation>
      </Centered>
    </ProfileModal>
  );
};

export default magicMemo(ContactProfileState, ['address', 'color', 'contact']);
