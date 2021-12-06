import React, { useCallback, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
import { abbreviations, magicMemo, profileUtils } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { showDeleteContactActionSheet } from '../contacts';
import CopyTooltip from '../copy-tooltip';
import { Centered } from '../layout';
import { Text, TruncatedAddress, TruncatedENS } from '../text';
import { ProfileAvatarButton, ProfileModal, ProfileNameInput } from './profile';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/emojiHandl... Remove this comment to see the full error message
} from '@rainbow-me/helpers/emojiHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
import { isValidDomainFormat } from '@rainbow-me/helpers/validators';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useContacts } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, padding } from '@rainbow-me/styles';

const AddressAbbreviation = styled(TruncatedAddress).attrs(
  ({ theme: { colors } }) => ({
    align: 'center',
    color: colors.blueGreyDark,
    firstSectionLength: abbreviations.defaultNumCharsPerSection,
    size: 'lmedium',
    truncationLength: 4,
    weight: 'regular',
  })
)`
  ${margin(9, 0, 5)};
  opacity: 0.6;
  width: 100%;
`;

const ENSAbbreviation = styled(TruncatedENS).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark,
  size: 'lmedium',
  truncationLength: 18,
  weight: 'regular',
}))`
  ${margin(9, 0, 5)};
  opacity: 0.6;
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: 19;
`;

const SubmitButton = styled(Button).attrs(
  ({ theme: { colors }, value, color }) => ({
    backgroundColor:
      value.length > 0
        ? typeof color === 'string'
          ? color
          : colors.avatarBackgrounds[color] || colors.appleBlue
        : undefined,
    // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'boolean' ... Remove this comment to see the full error message
    disabled: !value.length > 0,
    showShadow: true,
    size: 'small',
  })
)`
  height: 43;
  width: 215;
`;

const SubmitButtonLabel = styled(Text).attrs(({ value }) => ({
  color: value.length > 0 ? 'whiteLabel' : 'white',
  size: 'lmedium',
  weight: 'bold',
}))`
  margin-bottom: 1.5;
`;

const ContactProfileState = ({ address, color: colorProp, contact }: any) => {
  const { goBack } = useNavigation();
  const { onAddOrUpdateContacts, onRemoveContact } = useContacts();
  const [color, setColor] = useState(colorProp || 0);
  const [value, setValue] = useState(
    removeFirstEmojiFromString(contact?.nickname || '')
  );
  const [emoji, setEmoji] = useState(returnStringFirstEmoji(contact?.nickname));
  const inputRef = useRef(null);
  const { network } = useAccountSettings();

  const handleAddContact = useCallback(() => {
    const nickname = (emoji ? `${emoji} ${value}` : value).trim();
    if (value.length > 0 || color !== colorProp) {
      onAddOrUpdateContacts(address, nickname, color, network);
      goBack();
    }
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
  }, [
    address,
    color,
    colorProp,
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
  }, [address, goBack, onRemoveContact, value]);

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  const isContact = contact && !contact.temporary;

  const { isDarkMode, colors } = useTheme();

  const handleChangeAvatar = useCallback(() => {
    const prevAvatarIndex = profileUtils.avatars.findIndex(
      avatar => avatar.emoji === emoji
    );
    const nextAvatarIndex = (prevAvatarIndex + 1) % profileUtils.avatars.length;
    setColor(profileUtils.avatars[nextAvatarIndex]?.colorIndex);
    setEmoji(profileUtils.avatars[nextAvatarIndex]?.emoji);
  }, [emoji, setColor]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ProfileModal onPressBackdrop={handleAddContact}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered css={padding(24, 25)} direction="column">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ProfileAvatarButton
          changeAvatar={handleChangeAvatar}
          color={color}
          marginBottom={0}
          radiusAndroid={32}
          testID="contact-profile-avatar-button"
          value={emoji || value}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Spacer />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ProfileNameInput
          onChange={setValue}
          onSubmitEditing={handleAddContact}
          placeholder="Name"
          ref={inputRef}
          selectionColor={colors.avatarBackgrounds[color]}
          testID="contact-profile-name-input"
          value={value}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CopyTooltip
          onHide={handleTriggerFocusInput}
          textToCopy={address}
          tooltipText="Copy Address"
        >
          {isValidDomainFormat(address) ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ENSAbbreviation ens={address} />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AddressAbbreviation address={address} />
          )}
        </CopyTooltip>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered paddingVertical={19} width={93}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Divider inset={false} />
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SubmitButton
          color={color}
          isDarkMode={isDarkMode}
          onPress={handleAddContact}
          testID="contact-profile-add-button"
          value={value}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SubmitButtonLabel value={value}>
            {isContact ? 'Done' : 'Add Contact'}
          </SubmitButtonLabel>
        </SubmitButton>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonPressAnimation
          marginTop={11}
          onPress={
            isContact
              ? handleDeleteContact
              : () => {
                  goBack();
                  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
                  android && Keyboard.dismiss();
                }
          }
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Centered
            backgroundColor={colors.white}
            css={padding(8, 9)}
            testID="contact-profile-cancel-button"
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.4)}
              size="lmedium"
              weight="regular"
            >
              {isContact ? 'Delete Contact' : 'Cancel'}
            </Text>
          </Centered>
        </ButtonPressAnimation>
      </Centered>
    </ProfileModal>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(ContactProfileState, ['address', 'color', 'contact']);
