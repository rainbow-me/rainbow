import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Platform, View } from 'react-native';
import { compose, withHandlers } from 'recompact';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import {
  addCashButtonAvailable,
  isAvatarPickerAvailable,
} from '../../config/experimental';
import { colors, borders } from '../../styles';
import { abbreviations } from '../../utils';
import { useNavigation } from 'react-navigation-hooks';
import { useAccountData, useClipboard } from '../../hooks';
import CopyTooltip from '../copy-tooltip';
import { FloatingEmojis } from '../floating-emojis';
import Divider from '../Divider';
import { Centered, RowWithMargins } from '../layout';
import { TruncatedAddress } from '../text';
import AddCashButton from './AddCashButton';
import ProfileAction from './ProfileAction';

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  family: 'SFProRounded',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  margin-bottom: 2;
  width: 100%;
`;

const AvatarCircle = styled(View)`
  border-radius: 33px;
  height: 65px;
  margin-bottom: 16px;
  width: 65px;
`;

const ProfileMasthead = ({
  accountAddress,
  showBottomDivider,
  onPressAvatar,
}) => {
  const { accountENS } = useAccountData();
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();

  const onAddCash = useCallback(() => {
    navigate('AddCashSheet');
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate]);

  return (
    <Centered
      direction="column"
      marginBottom={24}
      paddingBottom={Platform.OS === 'ios' && addCashButtonAvailable ? 12 : 42}
    >
      {isAvatarPickerAvailable ? (
        <AvatarCircle onPress={onPressAvatar} />
      ) : (
        <FastImage
          source={AvatarImageSource}
          style={{ ...borders.buildCircleAsObject(85) }}
        />
      )}
      <CopyTooltip textToCopy={accountAddress} tooltipText="Copy Address">
        <AddressAbbreviation address={accountENS || accountAddress} />
      </CopyTooltip>
      <RowWithMargins align="center" margin={1}>
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
            />
          )}
        </FloatingEmojis>
        <ProfileAction
          icon="qrCode"
          onPress={() => navigate('ReceiveModal')}
          scaleTo={0.88}
          text="Receive"
        />
      </RowWithMargins>
      {Platform.OS === 'ios' && addCashButtonAvailable && (
        <AddCashButton onPress={onAddCash} />
      )}
      {showBottomDivider && (
        <Divider
          color={colors.rowDividerLight}
          style={{ bottom: 0, position: 'absolute' }}
        />
      )}
    </Centered>
  );
};

ProfileMasthead.propTypes = {
  accountAddress: PropTypes.string,
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
          navigation.navigate('AvatarBuilder', {
            accountColor: accountColor,
            accountName: accountName,
          });
        },
        recyclerListRef.getCurrentScrollOffset() > 0 ? 200 : 1
      );
    },
  })
)(ProfileMasthead);
