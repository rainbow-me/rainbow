import analytics from '@segment/analytics-react-native';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { getRandomColor } from '../../styles/colors';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { BiometricButtonContent } from '../buttons';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../contacts/ImageAvatar' was resolved to '... Remove this comment to see the full error message
import ImageAvatar from '../contacts/ImageAvatar';
import CopyTooltip from '../copy-tooltip';
import { Centered, ColumnWithDividers } from '../layout';
import { AvatarCircle } from '../profile';
import { Text, TruncatedAddress } from '../text';
import { ProfileModal, ProfileNameInput } from './profile';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/emojiHandl... Remove this comment to see the full error message
} from '@rainbow-me/helpers/emojiHandler';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountProfile } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${margin(android ? 0 : 6, 0, android ? 0 : 5)};
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
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
}: any) {
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

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <WalletProfileModal>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered
        direction="column"
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        paddingBottom={android ? 15 : 30}
        testID="wallet-info-modal"
        width="100%"
      >
        {profileImage ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ProfileImage image={profileImage} size="large" />
        ) : (
          // hide avatar if creating new wallet since we
          // don't know what emoji / color it will be (determined by address)
          (!isNewProfile || address) && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AvatarCircle
              showcaseAccountColor={color}
              showcaseAccountSymbol={nameEmoji}
            />
          )
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {isNewProfile && !address && <Spacer />}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CopyTooltip
            onHide={handleTriggerFocusInput}
            textToCopy={address}
            tooltipText="Copy Address"
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <WalletProfileAddressText address={address} />
          </CopyTooltip>
        )}
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithDividers dividerRenderer={WalletProfileDivider} width="100%">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <WalletProfileButton onPress={handleSubmit}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BiometricButtonContent
            label={isNewProfile ? `${actionType} Wallet` : 'Done'}
            showIcon={actionType === 'Create'}
            testID="wallet-info-submit-button"
          />
        </WalletProfileButton>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <WalletProfileButton onPress={handleCancel}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <WalletProfileButtonText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedMedium"
            weight="medium"
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            {...(android && { lineHeight: 21 })}
          >
            Cancel
          </WalletProfileButtonText>
        </WalletProfileButton>
      </ColumnWithDividers>
    </WalletProfileModal>
  );
}
