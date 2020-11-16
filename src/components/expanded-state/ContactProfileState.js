import React, { useCallback, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components/primitives';
import { useAccountSettings, useContacts } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import { abbreviations, magicMemo } from '../../utils';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { showDeleteContactActionSheet } from '../contacts';
import CopyTooltip from '../copy-tooltip';
import { Centered } from '../layout';
import { Text, TruncatedAddress } from '../text';
import { ProfileAvatarButton, ProfileModal, ProfileNameInput } from './profile';
import { colors, margin, padding } from '@rainbow-me/styles';

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'lmedium',
  truncationLength: 4,
  weight: 'regular',
})`
  ${margin(9, 0, 5)};
  opacity: 0.6;
  width: 100%;
`;

const Spacer = styled.View`
  height: 19;
`;

const SubmitButton = styled(Button).attrs(({ value }) => ({
  backgroundColor: value.length > 0 ? colors.appleBlue : undefined,
  disabled: !value.length > 0,
  showShadow: true,
  size: 'small',
}))`
  height: 43;
  width: 215;
`;

const SubmitButtonLabel = styled(Text).attrs({
  color: 'white',
  size: 'lmedium',
  weight: 'semibold',
})`
  margin-bottom: 1.5;
`;

const ContactProfileState = ({ address, color: colorProp, contact }) => {
  const { goBack } = useNavigation();
  const { onAddOrUpdateContacts, onRemoveContact } = useContacts();

  const [color, setColor] = useState(colorProp || 0);
  const [value, setValue] = useState(contact?.nickname || '');
  const inputRef = useRef(null);
  const { network } = useAccountSettings();

  const handleAddContact = useCallback(() => {
    if (value.length > 0 || color !== colorProp) {
      onAddOrUpdateContacts(address, value, color, network);
      goBack();
    }
    android && Keyboard.dismiss();
  }, [
    address,
    color,
    colorProp,
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

  return (
    <ProfileModal onPressBackdrop={handleAddContact}>
      <Centered css={padding(24, 25)} direction="column">
        <ProfileAvatarButton
          color={color}
          marginBottom={0}
          radiusAndroid={32}
          setColor={setColor}
          testID="contact-profile-avatar-button"
          value={value}
        />
        <Spacer />
        <ProfileNameInput
          onChange={setValue}
          onSubmitEditing={handleAddContact}
          placeholder="Name"
          ref={inputRef}
          selectionColor={colors.avatarColor[color]}
          testID="contact-profile-name-input"
          value={value}
        />
        <CopyTooltip
          onHide={handleTriggerFocusInput}
          textToCopy={address}
          tooltipText="Copy Address"
        >
          <AddressAbbreviation address={address} />
        </CopyTooltip>
        <Centered paddingVertical={19} width={93}>
          <Divider inset={false} />
        </Centered>
        <SubmitButton
          onPress={handleAddContact}
          testID="contact-profile-add-button"
          value={value}
        >
          <SubmitButtonLabel>
            {contact ? 'Done' : 'Add Contact'}
          </SubmitButtonLabel>
        </SubmitButton>
        <ButtonPressAnimation
          marginTop={11}
          onPress={
            contact
              ? handleDeleteContact
              : () => {
                  goBack();
                  android && Keyboard.dismiss();
                }
          }
        >
          <Centered
            backgroundColor={colors.white}
            css={padding(8, 9)}
            testID="contact-profile-cancel-button"
          >
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.4)}
              size="lmedium"
              weight="regular"
            >
              {contact ? 'Delete Contact' : 'Cancel'}
            </Text>
          </Centered>
        </ButtonPressAnimation>
      </Centered>
    </ProfileModal>
  );
};

export default magicMemo(ContactProfileState, ['address', 'color', 'contact']);
