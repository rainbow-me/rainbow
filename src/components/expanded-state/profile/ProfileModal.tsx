import lang from 'i18n-js';
import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import Divider from '../../Divider';
import { ButtonPressAnimation } from '../../animations';
import { BiometricButtonContent } from '../../buttons';
import CopyTooltip from '../../copy-tooltip';
import { Centered, ColumnWithDividers } from '../../layout';
import { AvatarCircle } from '../../profile';
import { Text, TruncatedAddress } from '../../text';
import ProfileModalContainer from './ProfileModalContainer';
import ProfileNameInput from './ProfileNameInput';
import styled from '@/styled-thing';
import { margin, padding, position } from '@/styles';
import { useTheme } from '@/theme';

const ProfileAddressText = styled(TruncatedAddress).attrs(({ theme: { colors } }: any) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  firstSectionLength: 4,
  size: 'large',
  truncationLength: 4,
  weight: 'bold',
}))({
  ...margin.object(android ? 0 : 6, 0, android ? 0 : 5),
  width: '100%',
});

const Spacer = styled(View)({
  height: 19,
});

const ProfileButton = styled(ButtonPressAnimation)({
  ...padding.object(15, 0, 19),
  ...position.centeredAsObject,
  flexDirection: 'row',
  height: 58,
  width: '100%',
});

const ProfileButtonText = styled(Text).attrs({
  align: 'center',
  size: 'larger',
})({});

const ProfileDivider = styled(Divider).attrs(({ theme: { colors } }: any) => ({
  borderRadius: 1,
  color: colors.rowDividerLight,
  inset: false,
}))({});

const Container = styled(ProfileModalContainer).attrs({
  dividerRenderer: ProfileDivider,
})({
  ...padding.object(24, 19, 0),
  width: '100%',
});

type ProfileModalProps = {
  address?: string;
  imageAvatar?: string;
  emojiAvatar?: string;
  accentColor?: string;
  toggleSubmitButtonIcon?: boolean;
  toggleAvatar?: boolean;
  handleSubmit: () => void;
  onChange: (value: string) => void;
  inputValue: string;
  handleCancel: () => void;
  submitButtonText: string;
  placeholder: string;
};

const ProfileModal = ({
  address,
  imageAvatar,
  emojiAvatar,
  accentColor,
  toggleSubmitButtonIcon,
  toggleAvatar,
  handleSubmit,
  onChange,
  inputValue,
  handleCancel,
  submitButtonText,
  placeholder,
}: ProfileModalProps) => {
  const { colors, isDarkMode } = useTheme();
  const inputRef = useRef<any>(null);

  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [inputRef]);

  return (
    <Container>
      <Centered direction="column" paddingBottom={android ? 15 : 30} testID="wallet-info-modal" width="100%">
        {toggleAvatar &&
          (imageAvatar ? (
            <AvatarCircle
              image={imageAvatar}
              isAvatarPickerAvailable={false}
              onPress={null}
              overlayStyles={null}
              showcaseAccountColor={isDarkMode ? colors.trueBlack : colors.dark}
              showcaseAccountSymbol={null}
              size="large"
            />
          ) : (
            <AvatarCircle
              image={null}
              isAvatarPickerAvailable={false}
              onPress={null}
              overlayStyles={null}
              showcaseAccountColor={accentColor}
              showcaseAccountSymbol={emojiAvatar}
            />
          ))}
        {!toggleAvatar && <Spacer />}
        <ProfileNameInput
          onChange={onChange}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          ref={inputRef}
          selectionColor={accentColor}
          testID="wallet-info-input"
          value={inputValue}
        />
        {address && (
          <CopyTooltip
            onHide={handleTriggerFocusInput}
            textToCopy={address}
            tooltipText={lang.t('wallet.settings.copy_address_capitalized')}
          >
            <ProfileAddressText address={address} />
          </CopyTooltip>
        )}
      </Centered>
      <ColumnWithDividers dividerRenderer={ProfileDivider} width="100%">
        <ProfileButton onPress={handleSubmit}>
          <BiometricButtonContent label={submitButtonText} showIcon={toggleSubmitButtonIcon} testID="wallet-info-submit-button" />
        </ProfileButton>
        <ProfileButton onPress={handleCancel}>
          <ProfileButtonText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedMedium"
            testID="wallet-info-cancel-button"
            weight="medium"
            {...(android && { lineHeight: 21 })}
          >
            {lang.t('button.cancel')}
          </ProfileButtonText>
        </ProfileButton>
      </ColumnWithDividers>
    </Container>
  );
};

export default ProfileModal;
