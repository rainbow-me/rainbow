import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import useExperimentalFlag, {
  AVATAR_PICKER,
} from '../../config/experimentalHooks';
import showWalletErrorAlert from '../../helpers/support';
import {
  useAccountProfile,
  useClipboard,
  useDimensions,
  useWallets,
} from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RainbowButton } from '../buttons';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import AvatarCircle from './AvatarCircle';
import ProfileAction from './ProfileAction';

import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { abbreviations } from '@rainbow-me/utils';

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
  const { selectedWallet } = useWallets();
  const { setClipboard } = useClipboard();
  const { width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountSymbol,
    accountName,
  } = useAccountProfile();
  const isAvatarPickerAvailable = useExperimentalFlag(AVATAR_PICKER);

  const handlePressAvatar = useCallback(() => {
    if (!isAvatarPickerAvailable) return;
    recyclerListRef.scrollToTop(true);
    setTimeout(
      () => {
        navigate(Routes.AVATAR_BUILDER, {
          accountColor: accountColor,
          accountName: accountName,
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
    if (selectedWallet?.damaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate, selectedWallet?.damaged]);

  const handlePressAddCash = useCallback(() => {
    if (selectedWallet?.damaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.ADD_CASH_FLOW);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate, selectedWallet?.damaged]);

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

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
        <FloatingEmojis
          distance={250}
          duration={500}
          fadeOut={false}
          scaleTo={0}
          size={50}
          wiggleFactor={0}
        >
          {({ onNewEmoji }) => (
            <ProfileAction
              icon="copy"
              onPress={() => {
                if (selectedWallet?.damaged) {
                  showWalletErrorAlert();
                  return;
                }
                onNewEmoji();
                setClipboard(accountAddress);
              }}
              scaleTo={0.88}
              text="Copy Address"
              width={127}
            />
          )}
        </FloatingEmojis>
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
