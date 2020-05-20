import analytics from '@segment/analytics-react-native';
import GraphemeSplitter from 'grapheme-splitter';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Platform, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from 'react-navigation-hooks';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import { isAvatarPickerAvailable } from '../../config/experimental';
import { useAccountSettings, useClipboard } from '../../hooks';
import { DEFAULT_WALLET_NAME } from '../../model/wallet';
import Routes from '../../screens/Routes/routesNames';
import { borders, colors } from '../../styles';
import { abbreviations } from '../../utils';
import Divider from '../Divider';
import CopyTooltip from '../copy-tooltip';
import { FloatingEmojis } from '../floating-emojis';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress } from '../text';
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

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 32.5;
  line-height: 64;
  padding-left: 0.5px;
`;

const ProfileMasthead = ({
  accountAddress,
  accountColor,
  accountName,
  addCashAvailable,
  showBottomDivider,
  onPressAvatar,
}) => {
  const name = accountName || DEFAULT_WALLET_NAME;
  const color = accountColor || 0;
  const { accountENS } = useAccountSettings();
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();

  const onAddCash = useCallback(() => {
    navigate(Routes.ADD_CASH_SHEET);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate]);

  return (
    <Column
      align="center"
      height={addCashAvailable ? 260 : 185}
      marginBottom={24}
    >
      {isAvatarPickerAvailable ? (
        <AvatarCircle
          onPress={onPressAvatar}
          style={{ backgroundColor: colors.avatarColor[color] }}
        >
          <FirstLetter>
            {new GraphemeSplitter().splitGraphemes(name)[0]}
          </FirstLetter>
        </AvatarCircle>
      ) : (
        <FastImage
          source={AvatarImageSource}
          style={{ ...borders.buildCircleAsObject(85) }}
        />
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
  accountColor: PropTypes.number,
  accountName: PropTypes.string,
  addCashAvailable: PropTypes.bool,
  showBottomDivider: PropTypes.bool,
};

ProfileMasthead.defaultProps = {
  showBottomDivider: true,
};

export default compose(
  withHandlers({
    onPressAvatar: ({
      navigation,
      accountColor,
      accountName,
      recyclerListRef,
    }) => () => {
      recyclerListRef.scrollToTop(true);
      setTimeout(
        () => {
          navigation.navigate(Routes.AVATAR_BUILDER, {
            accountColor: accountColor,
            accountName: accountName,
          });
        },
        recyclerListRef.getCurrentScrollOffset() > 0 ? 200 : 1
      );
    },
  })
)(ProfileMasthead);
