import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { useContacts, useDimensions } from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { colors, margin, padding } from '../../styles';
import { abbreviations, magicMemo } from '../../utils';
import Divider from '../Divider';
import TouchableBackdrop from '../TouchableBackdrop';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { ContactAvatar, showDeleteContactActionSheet } from '../contacts';
import CopyTooltip from '../copy-tooltip';
import { Input } from '../inputs';
import { Centered, KeyboardFixedOpenLayout } from '../layout';
import { PlaceholderText, Text, TruncatedAddress } from '../text';
import FloatingPanels from './FloatingPanels';
import { AssetPanel } from './asset-panel';

const nativeStackAdditionalPadding = 80;

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

const NameInput = styled(Input).attrs({
  align: 'center',
  autoCapitalize: 'words',
  autoFocus: true,
  letterSpacing: 'roundedTight',
  returnKeyType: 'done',
  size: 'big',
  spellCheck: false,
  weight: 'bold',
})`
  width: 100%;
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

const AddContactState = ({
  address,
  color: colorProp,
  contact,
  onCloseModal,
  onRefocusInput,
}) => {
  const { width: deviceWidth } = useDimensions();
  const { dangerouslyGetParent, goBack } = useNavigation();
  const { onAddOrUpdateContacts, onRemoveContact } = useContacts();

  const [color, setColor] = useState(colorProp || 0);
  const [value, setValue] = useState(contact?.nickname || '');

  const nameInputRef = useRef();
  const placeHolderText = useRef();

  const additionalContainerPadding = useMemo(
    () =>
      dangerouslyGetParent().state.routeName === Routes.SEND_SHEET_NAVIGATOR &&
      isNativeStackAvailable
        ? nativeStackAdditionalPadding
        : 0,
    [dangerouslyGetParent]
  );

  const handleAddContact = useCallback(async () => {
    if (value.length > 0) {
      onAddOrUpdateContacts(address, value, color);
      if (onCloseModal) {
        onCloseModal();
      }
      goBack();
    }
  }, [address, color, goBack, onAddOrUpdateContacts, onCloseModal, value]);

  const handleCancel = useCallback(() => {
    if (onCloseModal) {
      onCloseModal();
    }
    goBack();
  }, [goBack, onCloseModal]);

  const handleChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const newValue = text.charCodeAt(0) === 32 ? text.substring(1) : text;

      if (newValue.length > 0) {
        placeHolderText.current.updateValue(' ');
      } else {
        placeHolderText.current.updateValue('Name');
      }

      setValue(newValue);
    },
    [placeHolderText]
  );

  const handleChangeColor = useCallback(
    () =>
      setColor(prevColor => {
        let newColor = prevColor + 1;
        if (newColor > colors.avatarColor.length - 1) {
          newColor = 0;
        }
        return newColor;
      }),
    []
  );

  const handleDeleteContact = useCallback(
    () =>
      showDeleteContactActionSheet({
        address,
        nickname: value,
        onDelete: handleCancel,
        removeContact: onRemoveContact,
      }),
    [address, handleCancel, onRemoveContact, value]
  );

  const handleFocusInput = useCallback(() => nameInputRef?.current?.focus(), [
    nameInputRef,
  ]);

  useEffect(() => {
    if (value.length === 0) {
      placeHolderText.current.updateValue('Name');
    }
    return () => {
      if (onRefocusInput) {
        onRefocusInput();
      }
    };
  }, [onRefocusInput, placeHolderText, value]);

  return (
    <KeyboardFixedOpenLayout additionalPadding={additionalContainerPadding}>
      <TouchableBackdrop onPress={handleAddContact} />
      <FloatingPanels maxWidth={deviceWidth - 110}>
        <AssetPanel>
          <Centered css={padding(24, 25)} direction="column">
            <ButtonPressAnimation onPress={handleChangeColor} scaleTo={0.96}>
              <ContactAvatar
                color={color}
                marginBottom={19}
                size="large"
                value={value}
              />
            </ButtonPressAnimation>
            <PlaceholderText ref={placeHolderText} />
            <NameInput
              onChange={handleChange}
              onSubmitEditing={handleAddContact}
              ref={nameInputRef}
              value={value}
            />
            <CopyTooltip
              onHide={handleFocusInput}
              textToCopy={address}
              tooltipText="Copy Address"
            >
              <AddressAbbreviation address={address} />
            </CopyTooltip>
            <Centered paddingVertical={19} width={93}>
              <Divider inset={false} />
            </Centered>
            <SubmitButton onPress={handleAddContact} value={value}>
              <SubmitButtonLabel>
                {contact ? 'Done' : 'Add Contact'}
              </SubmitButtonLabel>
            </SubmitButton>
            <ButtonPressAnimation
              marginTop={11}
              onPress={contact ? handleDeleteContact : handleCancel}
            >
              <Centered backgroundColor={colors.white} css={padding(8, 9)}>
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
        </AssetPanel>
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
};

export default magicMemo(AddContactState, ['address', 'color', 'contact']);
