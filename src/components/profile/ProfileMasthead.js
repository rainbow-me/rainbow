import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import React, { useCallback, useRef } from 'react';
import styled from 'styled-components/primitives';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RainbowButton } from '../buttons';
import ImageAvatar from '../contacts/ImageAvatar';
import { FloatingEmojis } from '../floating-emojis';
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
import { abbreviations } from '@rainbow-me/utils';

const dropdownArrowWidth = 21;

const FloatingEmojisRegion = styled(FloatingEmojis).attrs({
  distance: 250,
  duration: 500,
  fadeOut: false,
  scaleTo: 0,
  size: 50,
  wiggleFactor: 0,
})`
  height: 0;
  left: 0;
  position: absolute;
  top: 0;
  width: 130;
`;

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

const ProfileImage = styled(ImageAvatar)`
  margin-bottom: 15;
`;

export default function ProfileMasthead({
  addCashAvailable,
  recyclerListRef,
  showBottomDivider = true,
}) {
  const { isDamaged } = useWallets();
  const onNewEmoji = useRef();
  const setOnNewEmoji = useCallback(
    newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji),
    []
  );
  const { width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountSymbol,
    accountName,
    accountImage,
  } = useAccountProfile();
  const isAvatarPickerAvailable = useExperimentalFlag(AVATAR_PICKER);

  const handlePressAvatar = useCallback(() => {
    if (!isAvatarPickerAvailable) return;
    recyclerListRef.scrollToTop(true);
    setTimeout(
      () => {
        navigate(Routes.AVATAR_BUILDER, {
          initialAccountColor: accountColor,
          initialAccountName: accountName,
        });
      },
      recyclerListRef.getCurrentScrollOffset() > 0 ? 200 : 1
    );
  }, [
    accountColor,
    accountName,
    isAvatarPickerAvailable,
    navigate,
    recyclerListRef,
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
    if (onNewEmoji && onNewEmoji.current) {
      onNewEmoji.current();
    }
    Clipboard.setString(accountAddress);
  }, [accountAddress, isDamaged]);

  return (
    <Column
      align="center"
      height={addCashAvailable ? 260 : 185}
      marginBottom={24}
      marginTop={0}
    >
      {accountImage ? (
        <ProfileImage image={accountImage} size="large" />
      ) : (
        <AvatarCircle
          accountColor={accountColor}
          accountSymbol={accountSymbol}
          isAvatarPickerAvailable={isAvatarPickerAvailable}
          onPress={handlePressAvatar}
        />
      )}
      <ButtonPressAnimation onPress={handlePressChangeWallet} scaleTo={0.9}>
        <Row>
          <AccountName deviceWidth={deviceWidth}>{accountName}</AccountName>
          <DropdownArrow>
            <Icon color={colors.dark} direction="down" name="caret" />
          </DropdownArrow>
        </Row>
      </ButtonPressAnimation>
      <RowWithMargins align="center" margin={19}>
        <ProfileAction
          icon="copy"
          onPress={handlePressCopyAddress}
          scaleTo={0.88}
          text="Copy Address"
          width={127}
        />
        <FloatingEmojisRegion setOnNewEmoji={setOnNewEmoji} />
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
