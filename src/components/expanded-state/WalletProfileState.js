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
import { abbreviations, defaultProfileUtils } from '@rainbow-me/utils';
const WalletProfileAddressText = styled(TruncatedAddress).attrs(
  ({ theme: { colors } }) => ({
    align: 'center',
    color: colors.alpha(colors.blueGreyDark, 0.6),
    firstSectionLength: abbreviations.defaultNumCharsPerSection,
    size: 'lmedium',
    truncationLength: 4,
    weight: 'medium',
  })
)`
  ${margin(9, 0, 5)};
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
      ? defaultProfileUtils.addressHashedEmoji(address)
      : returnStringFirstEmoji(profile?.name) ||
        defaultProfileUtils.addressHashedEmoji(address);

  const { goBack, navigate } = useNavigation();
  const { accountImage } = useAccountProfile();

  const { colors } = useTheme();

  const indexOfForceColor = colors.avatarBackgrounds.indexOf(forceColor);
  const color = forceColor
    ? forceColor
    : isNewProfile && address
    ? defaultProfileUtils.addressHashedColorIndex(address)
    : profile.color !== null
    ? profile.color
    : isNewProfile
    ? null
    : (indexOfForceColor !== -1 && indexOfForceColor) || getRandomColor();
  const [value, setValue] = useState(
    profile?.name ? removeFirstEmojiFromString(profile.name).join('') : ''
  );
  const inputRef = useRef(null);

  const handleCancel = useCallback(() => {
    goBack();
    if (actionType === 'Create') {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, goBack, navigate]);

  const handleSubmit = useCallback(() => {
    onCloseModal({
      color:
        typeof color === 'string'
          ? defaultProfileUtils.colorHexToIndex(color)
          : color,
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
        paddingBottom={30}
        testID="wallet-info-modal"
        width="100%"
      >
        {accountImage ? (
          <ProfileImage image={accountImage} size="large" />
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
