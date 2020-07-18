import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components/primitives';
import BiometryTypes from '../../helpers/biometryTypes';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import CopyTooltip from '../copy-tooltip';
import { Icon } from '../icons';
import { Centered, ColumnWithDividers, RowWithMargins } from '../layout';
import { Text, TruncatedAddress } from '../text';
import { ProfileAvatarButton, ProfileModal, ProfileNameInput } from './profile';
import { useBiometryType } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { colors, margin, padding, position } from '@rainbow-me/styles';
import { abbreviations } from '@rainbow-me/utils';

const BiometryIcon = styled(Icon).attrs(({ biometryType }) => ({
  color: colors.appleBlue,
  name: biometryType.toLowerCase(),
  size: biometryType === BiometryTypes.passcode ? 19 : 20,
}))``;

const WalletProfileAddressText = styled(TruncatedAddress).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'lmedium',
  truncationLength: 4,
  weight: 'medium',
})`
  ${margin(9, 0, 5)};
  width: 100%;
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

const WalletProfileDivider = styled(Divider).attrs({
  borderRadius: 1,
  color: colors.rowDividerLight,
  inset: false,
})``;

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
}) {
  const biometryType = useBiometryType();
  const { goBack, navigate } = useNavigation();

  const [color, setColor] = useState(
    (profile.color !== null && profile.color) || colors.getRandomColor()
  );
  const [value, setValue] = useState(profile?.name || '');
  const inputRef = useRef(null);

  const handleCancel = useCallback(() => {
    goBack();
    if (actionType === 'Create') {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, goBack, navigate]);

  const handleSubmit = useCallback(() => {
    onCloseModal({ color, name: value });
    goBack();
    if (actionType === 'Create' && isNewProfile) {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, color, goBack, isNewProfile, navigate, onCloseModal, value]);

  const handleTriggerFocusInput = useCallback(() => inputRef.current?.focus(), [
    inputRef,
  ]);

  const showBiometryIcon =
    actionType === 'Create' &&
    (biometryType === BiometryTypes.passcode ||
      biometryType === BiometryTypes.TouchID);
  const showFaceIDCharacter =
    actionType === 'Create' && biometryType === BiometryTypes.FaceID;

  return (
    <WalletProfileModal>
      <Centered direction="column" paddingBottom={30} width="100%">
        <ProfileAvatarButton color={color} setColor={setColor} value={value} />
        <ProfileNameInput
          onChange={setValue}
          onSubmitEditing={handleSubmit}
          placeholder="Name your wallet"
          ref={inputRef}
          selectionColor={colors.avatarColor[color]}
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
          <RowWithMargins align="center" justify="center" margin={7}>
            {showBiometryIcon && <BiometryIcon biometryType={biometryType} />}
            <WalletProfileButtonText
              color="appleBlue"
              letterSpacing="rounded"
              weight="semibold"
            >
              {showFaceIDCharacter && '􀎽 '}
              {isNewProfile ? `${actionType} Wallet` : 'Done'}
            </WalletProfileButtonText>
          </RowWithMargins>
        </WalletProfileButton>
        <WalletProfileButton onPress={handleCancel}>
          <WalletProfileButtonText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedMedium"
            weight="medium"
          >
            Cancel
          </WalletProfileButtonText>
        </WalletProfileButton>
      </ColumnWithDividers>
    </WalletProfileModal>
  );
}
