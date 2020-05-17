import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { colors, padding } from '../../styles';
import { abbreviations, deviceUtils } from '../../utils';
import Divider from '../Divider';
import TouchableBackdrop from '../TouchableBackdrop';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { ContactAvatar } from '../contacts';
import CopyTooltip from '../copy-tooltip';
import { Input } from '../inputs';
import { Centered, KeyboardFixedOpenLayout } from '../layout';
import { Text, TruncatedAddress } from '../text';
import PlaceholderText from '../text/PlaceholderText';
import FloatingPanels from './FloatingPanels';
import { AssetPanel } from './asset-panel';

const sx = StyleSheet.create({
  addressAbbreviation: {
    marginBottom: 5,
    marginHorizontal: 0,
    marginTop: 9,
    opacity: 0.6,
    width: '100%',
  },
});

export default function WalletProfileCreator({
  actionType,
  address,
  isNewProfile,
  onCloseModal,
  profile,
}) {
  const { goBack } = useNavigation();
  const [color, setColor] = useState(
    (profile.color !== null && profile.color) || colors.getRandomColor()
  );
  const [value, setValue] = useState(get(profile, 'name', ''));
  const inputRef = useRef(null);
  const text = useRef(null);

  useEffect(() => {
    if (!value || value.length === 0) {
      text.current.updateValue('Name your wallet');
    }
  }, [value]);

  const editProfile = useCallback(async () => {
    if (value && value.length > 0) {
      onCloseModal({
        color: color,
        name: value,
      });
      goBack();
    }
  }, [color, goBack, onCloseModal, value]);

  const addProfileInfo = useCallback(async () => {
    goBack();
    onCloseModal({ color, name: value });
  }, [color, goBack, onCloseModal, value]);

  const cancel = useCallback(() => {
    goBack();
    onCloseModal();
  }, [goBack, onCloseModal]);

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

  const handleFocusInput = useCallback(async () => {
    if (inputRef) {
      inputRef.current.focus();
    }
  }, []);

  const acceptAction = isNewProfile ? addProfileInfo : editProfile;

  return (
    <KeyboardFixedOpenLayout>
      <TouchableBackdrop />
      <FloatingPanels maxWidth={deviceUtils.dimensions.width - 110}>
        <AssetPanel>
          <Centered css={padding(24, 25)} direction="column">
            <ButtonPressAnimation onPress={handleChangeColor} scaleTo={0.96}>
              <ContactAvatar
                color={color}
                size="large"
                marginBottom={19}
                value={value}
              />
            </ButtonPressAnimation>
            <PlaceholderText ref={text} />
            <Input
              autoFocus
              letterSpacing={0.2}
              onChange={handleChange}
              onSubmitEditing={acceptAction}
              returnKeyType="done"
              size="big"
              ref={inputRef}
              style={{ width: '100%' }}
              textAlign="center"
              value={value}
              weight="semibold"
            />
            {address && (
              <CopyTooltip
                onHide={handleFocusInput}
                textToCopy={address}
                tooltipText="Copy Address"
              >
                <TruncatedAddress
                  style={sx.addressAbbreviation}
                  address={address}
                  align="center"
                  color={colors.blueGreyDark}
                  firstSectionLength={abbreviations.defaultNumCharsPerSection}
                  size="lmedium"
                  truncationLength={4}
                  weight="regular"
                />
              </CopyTooltip>
            )}
            <Centered paddingVertical={19} width={93}>
              <Divider inset={false} />
            </Centered>
            <Button
              backgroundColor={colors.appleBlue}
              height={43}
              onPress={acceptAction}
              showShadow
              size="small"
              width={215}
            >
              <Text
                color="white"
                size="lmedium"
                style={{ marginBottom: 1.5 }}
                weight="semibold"
              >
                {isNewProfile
                  ? value && value.length > 0
                    ? `${actionType} Wallet`
                    : 'Skip'
                  : 'Done'}
              </Text>
            </Button>
            <ButtonPressAnimation marginTop={11} onPress={cancel}>
              <Centered backgroundColor={colors.white} css={padding(8, 9)}>
                <Text
                  color={colors.alpha(colors.blueGreyDark, 0.4)}
                  size="lmedium"
                  weight="regular"
                >
                  Cancel
                </Text>
              </Centered>
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
  profile: PropTypes.object,
};
