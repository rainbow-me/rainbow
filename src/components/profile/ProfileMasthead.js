import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import {
  addCashButtonAvailable,
  isAvatarPickerAvailable,
} from '../../config/experimental';
import { colors, borders, margin } from '../../styles';
import { abbreviations, getFirstGrapheme } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { useNavigation } from 'react-navigation-hooks';
import { useAccountData, useClipboard } from '../../hooks';
import CopyTooltip from '../copy-tooltip';
import Divider from '../Divider';
import { Centered, RowWithMargins } from '../layout';
import { FloatingEmojis } from '../floating-emojis';
import { TruncatedAddress } from '../text';
import AddCashButton from './AddCashButton';
import ProfileAction from './ProfileAction';

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  family: 'SFProRounded',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 0.5,
  lineHeight: 31,
  monospace: false,
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  ${margin(1, 0, 2)};
  width: 100%;
`;

const AvatarCircle = styled(View)`
  border-radius: 33px;
  height: 65px;
  margin-bottom: 16px;
  width: 65px;
`;

const FirstLetter = styled(Text)`
  color: #fff;
  font-size: 37;
  font-weight: 600;
  line-height: 65;
  text-align: center;
  width: 100%;
`;

const ProfileMasthead = ({
  accountAddress,
  accountColor,
  accountName,
  showBottomDivider,
}) => {
  const { accountENS } = useAccountData();
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();

  const handleAvatarPress = useCallback(
    () => navigate('AvatarBuilder', { accountColor, accountName }),
    [accountColor, accountName, navigate]
  );

  return (
    <Centered
      direction="column"
      marginBottom={24}
      paddingBottom={addCashButtonAvailable ? 12 : 32}
    >
      {isAvatarPickerAvailable ? (
        <ButtonPressAnimation
          hapticType="impactMedium"
          onPress={handleAvatarPress}
          scaleTo={0.82}
        >
          <AvatarCircle
            style={{ backgroundColor: colors.avatarColor[accountColor] }}
          >
            <FirstLetter>{getFirstGrapheme(accountName)}</FirstLetter>
          </AvatarCircle>
        </ButtonPressAnimation>
      ) : (
        <FastImage
          source={AvatarImageSource}
          style={{
            ...borders.buildCircleAsObject(85),
            marginBottom: 3,
          }}
        />
      )}
      <CopyTooltip textToCopy={accountAddress} tooltipText="Copy Address">
        <AddressAbbreviation address={accountENS || accountAddress} />
      </CopyTooltip>
      <RowWithMargins align="center" margin={1}>
        <FloatingEmojis>
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
      {addCashButtonAvailable && (
        <AddCashButton onPress={() => navigate('AddCashSheet')} />
      )}
      {showBottomDivider && (
        <Divider style={{ bottom: 0, position: 'absolute' }} />
      )}
    </Centered>
  );
};

ProfileMasthead.propTypes = {
  accountAddress: PropTypes.string,
  accountColor: PropTypes.number,
  accountName: PropTypes.string,
  showBottomDivider: PropTypes.bool,
};

ProfileMasthead.defaultProps = {
  showBottomDivider: true,
};

export default React.memo(ProfileMasthead);
