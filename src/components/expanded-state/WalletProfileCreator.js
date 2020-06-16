import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import BiometryTypes from '../../helpers/biometryTypes';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { useBiometryType, useMagicAutofocus } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import Routes from '../../screens/Routes/routesNames';
import { colors, padding } from '../../styles';
import { abbreviations, deviceUtils } from '../../utils';
import Divider from '../Divider';
import TouchableBackdrop from '../TouchableBackdrop';
import { ButtonPressAnimation } from '../animations';
import { ContactAvatar } from '../contacts';
import CopyTooltip from '../copy-tooltip';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { Centered, KeyboardFixedOpenLayout, RowWithMargins } from '../layout';
import { Text, TruncatedAddress } from '../text';
import PlaceholderText from '../text/PlaceholderText';
import FloatingPanels from './FloatingPanels';
import { AssetPanel } from './asset-panel';

const sx = StyleSheet.create({
  addressAbbreviation: {
    marginBottom: 5,
    marginHorizontal: 0,
    marginTop: 9,
    width: '100%',
  },
  walletNameInput: {
    width: '100%',
  },
});

const nativeStackAdditionalPadding = 80;

export default function WalletProfileCreator({
  actionType,
  address,
  isNewProfile,
  onCloseModal,
  onRefocusInput,
  profile,
}) {
  const biometryType = useBiometryType();
  const { dangerouslyGetParent, goBack, navigate } = useNavigation();
  const [color, setColor] = useState(
    (profile.color !== null && profile.color) || colors.getRandomColor()
  );
  const [value, setValue] = useState(get(profile, 'name', ''));
  const inputRef = useRef(null);
  const text = useRef(null);

  const additionalPadding =
    dangerouslyGetParent().state.routeName ===
      Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR && isNativeStackAvailable
      ? nativeStackAdditionalPadding
      : 0;

  useEffect(() => {
    if (!value || value.length === 0) {
      text.current.updateValue('Name your wallet');
    }
  }, [value]);

  const addProfileInfo = useCallback(async () => {
    goBack();
    onCloseModal({ color, name: value });
  }, [color, goBack, onCloseModal, value]);

  const editProfile = useCallback(async () => {
    onCloseModal({
      color: color,
      name: value,
    });
    goBack();
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [color, goBack, navigate, onCloseModal, value]);

  const cancelEdit = useCallback(() => {
    goBack();
    navigate(Routes.CHANGE_WALLET_SHEET);
    onCloseModal();
  }, [goBack, navigate, onCloseModal]);

  const cancelImport = useCallback(() => {
    goBack();
    onCloseModal();
    onRefocusInput();
  }, [goBack, onCloseModal, onRefocusInput]);

  const handleChange = useCallback(({ nativeEvent: { text: inputText } }) => {
    const value =
      inputText.charCodeAt(0) === 32 ? inputText.substring(1) : inputText;
    if (value.length > 0) {
      text.current.updateValue(' ');
    } else {
      text.current.updateValue('Name your wallet');
    }
    setValue(value);
  }, []);

  const handleChangeColor = useCallback(async () => {
    let newColor = color + 1;
    if (newColor > colors.avatarColor.length - 1) {
      newColor = 0;
    }
    setColor(newColor);
  }, [color]);

  const [handleDidFocus] = useMagicAutofocus(inputRef.current);
  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  const acceptAction = isNewProfile ? addProfileInfo : editProfile;
  const cancelAction = actionType === 'Import' ? cancelImport : cancelEdit;

  const biometryIcon = biometryType ? biometryType.toLowerCase() : null;
  const showBiometryIcon =
    actionType === 'Create' &&
    (biometryType === BiometryTypes.passcode ||
      biometryType === BiometryTypes.TouchID);
  const showFaceIDCharacter =
    actionType === 'Create' && biometryType === BiometryTypes.FaceID;

  return (
    <KeyboardFixedOpenLayout additionalPadding={additionalPadding}>
      <TouchableBackdrop />
      <FloatingPanels maxWidth={deviceUtils.dimensions.width - 110}>
        <AssetPanel>
          <Centered css={padding(24, 24, 5)} direction="column">
            <ButtonPressAnimation onPress={handleChangeColor} scaleTo={0.96}>
              <ContactAvatar
                color={color}
                marginBottom={15}
                size="large"
                value={value}
              />
            </ButtonPressAnimation>
            <PlaceholderText ref={text} />
            <Input
              autoCapitalize="words"
              letterSpacing="roundedTight"
              onChange={handleChange}
              onFocus={handleDidFocus}
              onSubmitEditing={acceptAction}
              ref={inputRef}
              returnKeyType="done"
              size="big"
              spellCheck={false}
              style={sx.walletNameInput}
              textAlign="center"
              value={value}
              weight="bold"
            />
            {address && (
              <CopyTooltip
                onHide={handleTriggerFocusInput}
                textToCopy={address}
                tooltipText="Copy Address"
              >
                <TruncatedAddress
                  address={address}
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.6)}
                  firstSectionLength={abbreviations.defaultNumCharsPerSection}
                  size="lmedium"
                  style={sx.addressAbbreviation}
                  truncationLength={4}
                  weight="medium"
                />
              </CopyTooltip>
            )}
            <Centered paddingTop={30} width="100%">
              <Divider
                borderRadius={1}
                color={colors.rowDividerLight}
                inset={false}
              />
            </Centered>
            <ButtonPressAnimation
              onPress={acceptAction}
              paddingBottom={19}
              paddingTop={15}
              width="100%"
            >
              <RowWithMargins align="center" justify="center" margin={7}>
                {showBiometryIcon && (
                  <Icon
                    color={colors.appleBlue}
                    name={biometryIcon}
                    size={biometryIcon === 'passcode' ? 19 : 20}
                  />
                )}
                <Text
                  align="center"
                  color="appleBlue"
                  letterSpacing="rounded"
                  size="larger"
                  weight="semibold"
                >
                  {showFaceIDCharacter && '􀎽 '}
                  {isNewProfile ? `${actionType} Wallet` : 'Done'}
                </Text>
              </RowWithMargins>
            </ButtonPressAnimation>
            <Centered>
              <Divider
                borderRadius={1}
                color={colors.rowDividerLight}
                inset={false}
              />
            </Centered>
            <ButtonPressAnimation
              onPress={cancelAction}
              paddingBottom={19}
              paddingTop={15}
              width="100%"
            >
              <Text
                align="center"
                color={colors.alpha(colors.blueGreyDark, 0.6)}
                letterSpacing="roundedMedium"
                size="larger"
                weight="medium"
              >
                Cancel
              </Text>
            </ButtonPressAnimation>
          </Centered>
        </AssetPanel>
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
}

WalletProfileCreator.propTypes = {
  actionType: PropTypes.string,
  address: PropTypes.string,
  isNewProfile: PropTypes.bool,
  onCloseModal: PropTypes.func,
  onRefocusInput: PropTypes.func,
  profile: PropTypes.object,
};
