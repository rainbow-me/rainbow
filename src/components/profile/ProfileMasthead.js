import analytics from '@segment/analytics-react-native';
import GraphemeSplitter from 'grapheme-splitter';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import { isAvatarPickerAvailable } from '../../config/experimental';
import { useAccountSettings, useClipboard } from '../../hooks';
import { DEFAULT_WALLET_NAME } from '../../model/wallet';
import { useNavigation } from '../../navigation/Navigation';
import Routes from '../../screens/Routes/routesNames';
import { borders, colors } from '../../styles';
import { abbreviations } from '../../utils';
import Divider from '../Divider';
import CopyTooltip from '../copy-tooltip';
import { FloatingEmojis } from '../floating-emojis';
import { Column, RowWithMargins } from '../layout';
import { Text, TruncatedAddress } from '../text';
import AddCashButton from './AddCashButton';
import AvatarCircle from './AvatarCircle';
import ProfileAction from './ProfileAction';

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  height: 33;
  margin-top: ${isAvatarPickerAvailable ? 0 : -6};
  padding-left: 24;
  padding-right: 24;
`;

const AvatarImage = styled(FastImage).attrs({ source: AvatarImageSource })`
  ${borders.buildCircle(85)};
`;

const ProfileMastheadDivider = styled(Divider).attrs({
  color: colors.rowDividerLight,
})`
  bottom: 0;
  position: absolute;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 32.5;
  line-height: 64;
  padding-left: 0.5px;
`;

export default function ProfileMasthead({
  accountAddress,
  accountColor,
  accountName,
  addCashAvailable,
  recyclerListRef,
  showBottomDivider = true,
}) {
  const name = accountName || DEFAULT_WALLET_NAME;
  const color = accountColor || 0;
  const { accountENS } = useAccountSettings();
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();

  const handlePressAddCash = useCallback(() => {
    navigate(Routes.ADD_CASH_SHEET);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate]);

  const handlePressAvatar = useCallback(() => {
    if (recyclerListRef) {
      recyclerListRef.scrollToTop(true);
      setTimeout(
        () => navigate(Routes.AVATAR_BUILDER, { accountColor, accountName }),
        recyclerListRef.getCurrentScrollOffset() > 0 ? 200 : 1
      );
    }
  }, [accountColor, accountName, navigate, recyclerListRef]);

  return (
    <Column
      align="center"
      height={addCashAvailable ? 260 : 185}
      marginBottom={24}
    >
      {isAvatarPickerAvailable ? (
        <AvatarCircle
          onPress={handlePressAvatar}
          style={{ backgroundColor: colors.avatarColor[color] }}
        >
          <FirstLetter>
            {new GraphemeSplitter().splitGraphemes(name)[0]}
          </FirstLetter>
        </AvatarCircle>
      ) : (
        <AvatarImage />
      )}
      <CopyTooltip
        textToCopy={accountENS || accountAddress}
        tooltipText={Platform.OS === 'android' ? 'Address Copied' : 'Copy'}
      >
        <AddressAbbreviation address={accountENS || accountAddress} />
      </CopyTooltip>
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
