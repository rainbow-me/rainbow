import analytics from '@segment/analytics-react-native';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { getRandomColor } from '../../styles/colors';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { BiometricButtonContent } from '../buttons';
import ImageAvatar from '../contacts/ImageAvatar';
import CopyTooltip from '../copy-tooltip';
import { Centered, ColumnWithDividers } from '../layout';
import { AvatarCircle } from '../profile';
import { Text, TruncatedAddress } from '../text';
import { ProfileModal, ProfileNameInput } from './profile';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@rainbow-me/helpers/emojiHandler';

import { useAccountProfile } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { margin, padding, position } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

const WalletProfileAddressText = styled(TruncatedAddress).attrs(
  ({ theme: { colors } }) => ({
    align: 'center',
    color: colors.alpha(colors.blueGreyDark, 0.6),
    firstSectionLength: 4,
    size: 'large',
    truncationLength: 4,
    weight: 'bold',
  })
)`
  ${margin(android ? 0 : 6, 0, android ? 0 : 5)};
  width: 100%;
`;

const Spacer = styled.View`
  height: 19;
`;

const WalletProfileButton = styled(ButtonPressAnimation)`
  ${padding(15, 0, 19)};
  ${position.centered};
  flex-direction: row;
  height: 58;
  width: 100%;
`;

const WalletProfileButtonText = styled(Text).attrs({
  align: 'center',
  size: 'larger',
})``;

const ProfileImage = styled(ImageAvatar)`
  margin-bottom: 15;
`;

const WalletProfileDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  borderRadius: 1,
  color: colors.rowDividerLight,
  inset: false,
}))``;
const WalletProfileModal = styled(ProfileModal).attrs({
  dividerRenderer: WalletProfileDivider,
})`
  ${padding(24, 19, 0)};
  width: 100%;
`;

export default function WalletProfileState({
  actionType,
  address,
  isNewProfile,
  onCloseModal,
  profile,
  forceColor,
}) {
  const nameEmoji =
    isNewProfile && !forceColor
      ? profileUtils.addressHashedEmoji(address)
      : returnStringFirstEmoji(profile?.name) ||
        profileUtils.addressHashedEmoji(address);

  const { goBack, navigate } = useNavigation();
  const { accountImage } = useAccountProfile();

  const { colors } = useTheme();

  const indexOfForceColor = colors.avatarBackgrounds.indexOf(forceColor);
  const color = forceColor
    ? forceColor
    : isNewProfile && address
    ? profileUtils.addressHashedColorIndex(address)
    : profile.color !== null
    ? profile.color
    : isNewProfile
    ? null
    : (indexOfForceColor !== -1 && indexOfForceColor) || getRandomColor();
  const [value, setValue] = useState(
    profile?.name ? removeFirstEmojiFromString(profile.name) : ''
  );
  const inputRef = useRef(null);

  const profileImage = accountImage || profile.image;

  const handleCancel = useCallback(() => {
    goBack();
    analytics.track('Tapped "Cancel" on Wallet Profile modal');
    if (actionType === 'Create') {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, goBack, navigate]);

  const handleSubmit = useCallback(() => {
    analytics.track('Tapped "Submit" on Wallet Profile modal');
    onCloseModal({
      color:
        typeof color === 'string' ? profileUtils.colorHexToIndex(color) : color,
      name: nameEmoji ? `${nameEmoji} ${value}` : value,
    });
    goBack();
    if (actionType === 'Create' && isNewProfile) {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [
    actionType,
    color,
    goBack,
    isNewProfile,
    nameEmoji,
    navigate,
    onCloseModal,
    value,
  ]);

  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  return (
    <WalletProfileModal>
      <Centered
        direction="column"
        paddingBottom={android ? 15 : 30}
        testID="wallet-info-modal"
        width="100%"
      >
        {profileImage ? (
          <ProfileImage image={profileImage} size="large" />
        ) : (
          // hide avatar if creating new wallet since we
          // don't know what emoji / color it will be (determined by address)
          (!isNewProfile || address) && (
            <AvatarCircle
              showcaseAccountColor={color}
              showcaseAccountSymbol={nameEmoji}
            />
          )
        )}
        {isNewProfile && !address && <Spacer />}
        <ProfileNameInput
          onChange={setValue}
          onSubmitEditing={handleSubmit}
          placeholder="Name your wallet"
          ref={inputRef}
          selectionColor={colors.avatarBackgrounds[color]}
          testID="wallet-info-input"
          value={value}
        />
        {address && (
          <CopyTooltip
            onHide={handleTriggerFocusInput}
            textToCopy={address}
            tooltipText="Copy Address"
          >
            <WalletProfileAddressText address={address} />
          </CopyTooltip>
        )}
      </Centered>
      <ColumnWithDividers dividerRenderer={WalletProfileDivider} width="100%">
        <WalletProfileButton onPress={handleSubmit}>
          <BiometricButtonContent
            label={isNewProfile ? `${actionType} Wallet` : 'Done'}
            showIcon={actionType === 'Create'}
            testID="wallet-info-submit-button"
          />
        </WalletProfileButton>
        <WalletProfileButton onPress={handleCancel}>
          <WalletProfileButtonText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedMedium"
            weight="medium"
            {...(android && { lineHeight: 21 })}
          >
            Cancel
          </WalletProfileButtonText>
        </WalletProfileButton>
      </ColumnWithDividers>
    </WalletProfileModal>
  );
}
