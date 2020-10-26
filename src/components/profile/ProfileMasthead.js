import analytics from '@segment/analytics-react-native';
import { find } from 'lodash';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/primitives';
import { walletsSetSelected, walletsUpdate } from '../../redux/wallets';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RainbowButton } from '../buttons';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import AvatarCircle from './AvatarCircle';
import ProfileAction from './ProfileAction';
import useExperimentalFlag, {
  AVATAR_PICKER,
} from '@rainbow-me/config/experimentalHooks';
import showWalletErrorAlert from '@rainbow-me/helpers/support';
import {
  useAccountProfile,
  useDimensions,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { abbreviations, showActionSheetWithOptions } from '@rainbow-me/utils';

const dropdownArrowWidth = 21;

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  height: 33;
  margin-top: -1;
  margin-bottom: 1;
  max-width: ${({ deviceWidth }) => deviceWidth - dropdownArrowWidth - 60};
  padding-right: 6;
`;

const AddCashButton = styled(RainbowButton).attrs({
  type: 'addCash',
})`
  margin-top: 16;
`;

const DropdownArrow = styled(Centered)`
  height: 9;
  margin-top: 11;
  width: ${dropdownArrowWidth};
`;

const ProfileMastheadDivider = styled(Divider).attrs({
  color: colors.rowDividerLight,
})`
  bottom: 0;
  position: absolute;
`;

export default function ProfileMasthead({
  addCashAvailable,
  recyclerListRef,
  showBottomDivider = true,
}) {
  const { wallets, selectedWallet, isDamaged } = useWallets();
  const { width: deviceWidth } = useDimensions();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountSymbol,
    accountName,
    accountImage,
  } = useAccountProfile();
  const isAvatarPickerAvailable = useExperimentalFlag(AVATAR_PICKER);
  const isAvatarEmojiPickerEnabled = true;
  const isAvatarImagePickerEnabled = true;

  const onRemovePhoto = useCallback(async () => {
    const newWallets = { ...wallets };
    const newWallet = newWallets[selectedWallet.id];
    const account = find(newWallet.addresses, ['address', accountAddress]);

    account.image = null;
    newWallet.addresses[account.index] = account;

    dispatch(walletsSetSelected(newWallet));
    await dispatch(walletsUpdate(newWallets));
  }, [dispatch, selectedWallet, accountAddress, wallets]);

  const handlePressAvatar = useCallback(() => {
    recyclerListRef?.scrollToTop(true);
    setTimeout(
      () => {
        if (isAvatarImagePickerEnabled) {
          const processPhoto = image => {
            const stringIndex = image?.path.indexOf('/tmp');
            const newWallets = { ...wallets };
            const walletId = selectedWallet.id;
            newWallets[walletId].addresses.some((account, index) => {
              newWallets[walletId].addresses[index].image =
                Platform.OS === 'ios'
                  ? `~${image?.path.slice(stringIndex)}`
                  : image?.path;
              dispatch(walletsSetSelected(newWallets[walletId]));
              return true;
            });
            dispatch(walletsUpdate(newWallets));
          };

          const avatarActionSheetOptions = [
            'Take Photo',
            'Choose from Library',
            ...(isAvatarPickerAvailable ? ['Pick an Emoji'] : []),
            ...(accountImage ? ['Remove Photo'] : []),
            ...(Platform.OS === 'ios' ? ['Cancel'] : []),
          ];

          showActionSheetWithOptions(
            {
              cancelButtonIndex: avatarActionSheetOptions.length - 1,
              destructiveButtonIndex: accountImage
                ? avatarActionSheetOptions.length - 2
                : undefined,
              options: avatarActionSheetOptions,
            },
            async buttonIndex => {
              if (buttonIndex === 0) {
                ImagePicker.openCamera({
                  cropperCircleOverlay: true,
                  cropping: true,
                }).then(processPhoto);
              } else if (buttonIndex === 1) {
                ImagePicker.openPicker({
                  cropperCircleOverlay: true,
                  cropping: true,
                }).then(processPhoto);
              } else if (buttonIndex === 2 && isAvatarEmojiPickerEnabled) {
                navigate(Routes.AVATAR_BUILDER, {
                  initialAccountColor: accountColor,
                  initialAccountName: accountName,
                });
              } else if (buttonIndex === 3 && accountImage) {
                onRemovePhoto();
              }
            }
          );
        } else if (isAvatarEmojiPickerEnabled) {
          navigate(Routes.AVATAR_BUILDER, {
            initialAccountColor: accountColor,
            initialAccountName: accountName,
          });
        }
      },
      recyclerListRef?.getCurrentScrollOffset() > 0 ? 200 : 1
    );
  }, [
    accountColor,
    accountImage,
    accountName,
    dispatch,
    isAvatarEmojiPickerEnabled,
    isAvatarImagePickerEnabled,
    isAvatarPickerAvailable,
    navigate,
    onRemovePhoto,
    recyclerListRef,
    selectedWallet.id,
    wallets,
  ]);

  const handlePressReceive = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate, isDamaged]);

  const handlePressAddCash = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.ADD_CASH_FLOW);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate, isDamaged]);

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const handlePressCopyAddress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
    }
  }, [isDamaged]);

  return (
    <Column
      align="center"
      height={addCashAvailable ? 260 : 185}
      marginBottom={24}
      marginTop={0}
    >
      <AvatarCircle
        accountColor={accountColor}
        accountSymbol={accountSymbol}
        image={accountImage}
        isAvatarPickerAvailable={isAvatarPickerAvailable}
        onPress={handlePressAvatar}
      />
      <ButtonPressAnimation onPress={handlePressChangeWallet} scaleTo={0.9}>
        <Row>
          <AccountName deviceWidth={deviceWidth}>{accountName}</AccountName>
          <DropdownArrow>
            <Icon color={colors.dark} direction="down" name="caret" />
          </DropdownArrow>
        </Row>
      </ButtonPressAnimation>
      <RowWithMargins align="center" margin={19}>
        <CopyFloatingEmojis
          disabled={isDamaged}
          onPress={handlePressCopyAddress}
          textToCopy={accountAddress}
        >
          <ProfileAction
            icon="copy"
            scaleTo={0.88}
            text="Copy Address"
            width={127}
          />
        </CopyFloatingEmojis>
        <ProfileAction
          icon="qrCode"
          onPress={handlePressReceive}
          scaleTo={0.88}
          text="Receive"
          width={81}
        />
      </RowWithMargins>
      {addCashAvailable && <AddCashButton onPress={handlePressAddCash} />}
      {showBottomDivider && <ProfileMastheadDivider />}
    </Column>
  );
}
