import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import { isAvatarPickerAvailable } from '../../config/experimental';
import { useAccountProfile, useClipboard } from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { colors } from '../../styles';
import { abbreviations, deviceUtils } from '../../utils';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import AddCashButton from './AddCashButton';
import AvatarCircle from './AvatarCircle';
import ProfileAction from './ProfileAction';

const dropdownArrowWidth = 21;
const maxAddressWidth = deviceUtils.dimensions.width - dropdownArrowWidth - 60;

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  height: 33;
  margin-top: -3;
  margin-bottom: 3;
  max-width: ${maxAddressWidth};
  padding-right: 6;
`;

const DropdownArrow = styled(Centered)`
  height: 9;
  margin-top: 9;
  width: 21;
`;

const ProfileMastheadDivider = styled(Divider).attrs({
  color: colors.rowDividerLight,
})`
  bottom: 0;
  position: absolute;
`;

export default function ProfileMasthead({
  accountAddress,
  addCashAvailable,
  recyclerListRef,
  showBottomDivider,
}) {
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();
  const { accountColor, accountSymbol, accountName } = useAccountProfile();

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
  }, [accountColor, accountName, navigate, recyclerListRef]);

  const handlePressAddCash = useCallback(() => {
    navigate(Routes.ADD_CASH_SHEET);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate]);

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
        onPress={handlePressAvatar}
        accountColor={accountColor}
        accountSymbol={accountSymbol}
      />
      <ButtonPressAnimation onPress={handlePressChangeWallet} scaleTo={0.9}>
        <Row>
          <AccountName>{accountName}</AccountName>
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
          onPress={() => navigate(Routes.RECEIVE_MODAL)}
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

ProfileMasthead.propTypes = {
  accountAddress: PropTypes.string,
  addCashAvailable: PropTypes.bool,
  showBottomDivider: PropTypes.bool,
};

ProfileMasthead.defaultProps = {
  showBottomDivider: true,
};
