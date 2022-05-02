import lang from 'i18n-js';
import React, { useCallback, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { BiometricButtonContent } from '../buttons';
import CopyTooltip from '../copy-tooltip';
import { Centered, ColumnWithDividers } from '../layout';
import { AvatarCircle } from '../profile';
import { Text, TruncatedAddress } from '../text';
import { ProfileModalContainer, ProfileNameInput } from './profile';
import styled from '@rainbow-me/styled-components';
import { margin, padding, position } from '@rainbow-me/styles';

const ProfileAddressText = styled(TruncatedAddress).attrs(
  ({ theme: { colors } }) => ({
    align: 'center',
    color: colors.alpha(colors.blueGreyDark, 0.6),
    firstSectionLength: 4,
    size: 'large',
    truncationLength: 4,
    weight: 'bold',
  })
)({
  ...margin.object(android ? 0 : 6, 0, android ? 0 : 5),
  width: '100%',
});

const Spacer = styled.View({
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

const ProfileDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
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

const ProfileModal = ({
  address,
  imageAvatar,
  emojiAvatar,
  accentColor,
  toggleSpacer,
  toggleSubmitButtonIcon,
  toggleAvatar,
  handleSubmit,
  onChange,
  value,
  handleCancel,
  submitButtonText,
  placeholder,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef(null);

  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  return (
    <Container>
      <Centered
        direction="column"
        paddingBottom={android ? 15 : 30}
        testID="wallet-info-modal"
        width="100%"
      >
        {toggleAvatar &&
          (imageAvatar ? (
            <AvatarCircle
              image={imageAvatar}
              showcaseAccountColor={colors.black}
              size="large"
            />
          ) : (
            <AvatarCircle
              showcaseAccountColor={accentColor}
              showcaseAccountSymbol={emojiAvatar}
            />
          ))}
        {toggleSpacer && <Spacer />}
        <ProfileNameInput
          onChange={onChange}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          ref={inputRef}
          selectionColor={colors.avatarBackgrounds[accentColor]}
          testID="wallet-info-input"
          value={value}
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
          <BiometricButtonContent
            label={submitButtonText}
            showIcon={toggleSubmitButtonIcon}
            testID="wallet-info-submit-button"
          />
        </ProfileButton>
        <ProfileButton onPress={handleCancel}>
          <ProfileButtonText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedMedium"
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
