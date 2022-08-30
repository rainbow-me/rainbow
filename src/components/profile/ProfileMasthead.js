import React, { useCallback } from 'react';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Column, Row } from '../layout';
import { TruncatedText } from '../text';
import AvatarCircle from './AvatarCircle';
import { useAccountProfile, useDimensions, useOnAvatarPress } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { abbreviations } from '@/utils';
import { useForegroundColor } from '@/design-system';

// NOTE:
// If you’re trying to edit this file for iOS and you’re not seeing any changes,
// that’s because iOS is using the Swift version — TransactionListViewHeader.
// Only Android is using this file at the moment.

const dropdownArrowWidth = 21;

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'big',
  truncationLength: 4,
  weight: 'bold',
})({
  height: android ? 38 : 33,
  marginBottom: android ? 10 : 1,
  marginTop: android ? -10 : -1,
  maxWidth: ({ deviceWidth }) => deviceWidth - dropdownArrowWidth - 60,
  paddingRight: 6,
});

const DropdownArrow = styled(Centered)({
  height: 5,
  marginTop: 11,
  width: dropdownArrowWidth,
});

const ProfileMastheadDivider = styled(Divider).attrs(
  ({ theme: { colors } }) => ({
    color: colors.rowDividerLight,
  })
)({
  marginTop: 19,
  bottom: 0,
  position: 'absolute',
});

export default function ProfileMasthead({
  recyclerListRef,
  showBottomDivider = true,
}) {
  const { width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const {
    accountColor,
    accountSymbol,
    accountName,
    accountImage,
  } = useAccountProfile();

  const {
    onAvatarPress,
    avatarActionSheetOptions,
    onSelectionCallback,
  } = useOnAvatarPress();

  const iconColor = useForegroundColor('secondary60');

  const handlePressAvatar = useCallback(() => {
    recyclerListRef?.scrollToTop(true);
    setTimeout(
      onAvatarPress,
      recyclerListRef?.getCurrentScrollOffset() > 0 ? 200 : 1
    );
  }, [onAvatarPress, recyclerListRef]);

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  return (
    <Column align="center" height={120} marginBottom={24} marginTop={0}>
      {/* [AvatarCircle -> ImageAvatar -> ImgixImage], so no need to sign accountImage here. */}
      <AvatarCircle
        accountColor={accountColor}
        accountSymbol={accountSymbol}
        image={accountImage}
        isAvatarPickerAvailable
        menuOptions={avatarActionSheetOptions}
        onPress={handlePressAvatar}
        onSelectionCallback={onSelectionCallback}
        style={android && { marginTop: 10 }}
      />
      <ButtonPressAnimation onPress={handlePressChangeWallet}>
        <Row>
          <AccountName deviceWidth={deviceWidth}>{accountName}</AccountName>
          <DropdownArrow>
            <Icon color={iconColor} name="caretDownIcon" />
          </DropdownArrow>
        </Row>
      </ButtonPressAnimation>
      {showBottomDivider && <ProfileMastheadDivider />}
    </Column>
  );
}
