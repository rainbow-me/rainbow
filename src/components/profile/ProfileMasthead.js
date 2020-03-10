import PropTypes from 'prop-types';
import React from 'react';
import { View, Text } from 'react-native';
import { compose, withHandlers } from 'recompact';
import FastImage from 'react-native-fast-image';
import GraphemeSplitter from 'grapheme-splitter';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import { margin, colors, borders } from '../../styles';
import { abbreviations } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { useNavigation } from 'react-navigation-hooks';
import { useClipboard } from '../../hooks';
import CopyTooltip from '../copy-tooltip';
import Divider from '../Divider';
import { Centered, RowWithMargins } from '../layout';
import { FloatingEmojis } from '../floating-emojis';
import { TruncatedAddress } from '../text';
import ProfileAction from './ProfileAction';
import { isAvatarPickerAvailable } from '../../config/experimental';

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  ${margin(1, 0, 3)};
  width: 100%;
`;

const Container = styled(Centered).attrs({ direction: 'column' })`
  margin-bottom: 24;
  padding-bottom: 32;
`;

const AvatarCircle = styled(View)`
  border-radius: 33px;
  margin-bottom: 16px;
  height: 65px;
  width: 65px;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 37;
  line-height: 65;
`;

const ProfileMasthead = ({
  accountAddress,
  showBottomDivider,
  accountColor,
  accountName,
  onPressAvatar,
}) => {
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();

  return (
    <Container>
      {isAvatarPickerAvailable ? (
        <ButtonPressAnimation
          hapticType="impactMedium"
          onPress={onPressAvatar}
          scaleTo={0.82}
        >
          <AvatarCircle
            style={{ backgroundColor: colors.avatarColor[accountColor] }}
          >
            <FirstLetter>
              {new GraphemeSplitter().splitGraphemes(accountName)[0]}
            </FirstLetter>
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
        <AddressAbbreviation address={accountAddress} />
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
          icon="inbox"
          onPress={() => navigate('ReceiveModal')}
          scaleTo={0.88}
          text="Receive"
        />
      </RowWithMargins>
      {showBottomDivider && (
        <Divider style={{ bottom: 0, position: 'absolute' }} />
      )}
    </Container>
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

export default compose(
  withHandlers({
    onPressAvatar: ({ navigation, accountColor, accountName }) => () =>
      navigation.navigate('AvatarBuilder', {
        accountColor: accountColor,
        accountName: accountName,
      }),
  })
)(ProfileMasthead);
