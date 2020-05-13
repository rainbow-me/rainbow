import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Platform, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import Caret from '../../assets/caret-down.png';
import { isAvatarPickerAvailable } from '../../config/experimental';
import { useAccountSettings, useClipboard } from '../../hooks';
import { DEFAULT_WALLET_NAME } from '../../model/wallet';
import { useNavigation } from '../../navigation/Navigation';
import Routes from '../../screens/Routes/routesNames';
import { colors } from '../../styles';
import { abbreviations } from '../../utils';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { Column, Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import AddCashButton from './AddCashButton';
import AvatarCircle from './AvatarCircle';
import ProfileAction from './ProfileAction';

const AccountName = styled(Text).attrs({
  align: 'center',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  height: 33;
  margin-top: -3;
  margin-bottom: 3;
  padding-left: 15;
  padding-right: 8;
`;

const DropdownSelector = styled(FastImage).attrs({
  source: Caret,
})`
  height: 20;
  width: 20;
  justify-content: center;
  align-items: center;
  margin-right: 15;
  margin-top: 3;
`;

const ProfileMasthead = ({
  accountAddress,
  addCashAvailable,
  showBottomDivider,
  recyclerListRef,
}) => {
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();
  const { accountEmoji, accountColor, accountName } = useAccountProfile();
  const onPressAvatar = useCallback(() => {
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

  const onAddCash = useCallback(() => {
    navigate(Routes.ADD_CASH_SHEET);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate]);

  const onChangeWallet = useCallback(() => {
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
        onPress={onPressAvatar}
        accountEmoji={accountEmoji}
        accountColor={accountColor}
      />
      <Row>
        <AccountName>{accountName}</AccountName>
        <ButtonPressAnimation onPress={onChangeWallet}>
          <DropdownSelector />
        </ButtonPressAnimation>
      </Row>
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
      {addCashAvailable && <AddCashButton onPress={onAddCash} />}
      {showBottomDivider && (
        <Divider
          color={colors.rowDividerLight}
          style={{ bottom: 0, position: 'absolute' }}
        />
      )}
    </Column>
  );
};

ProfileMasthead.propTypes = {
  accountAddress: PropTypes.string,
  addCashAvailable: PropTypes.bool,
  showBottomDivider: PropTypes.bool,
};

ProfileMasthead.defaultProps = {
  showBottomDivider: true,
};

export default ProfileMasthead;
