import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard, View, Text } from 'react-native';
import { compose, withHandlers, withState } from 'recompact';
import FastImage from 'react-native-fast-image';
import GraphemeSplitter from 'grapheme-splitter';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import { margin, colors, borders } from '../../styles';
import { abbreviations } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import CopyTooltip from '../copy-tooltip';
import Divider from '../Divider';
import { Centered, Column, RowWithMargins } from '../layout';
import { FloatingEmojis } from '../floating-emojis';
import { TruncatedAddress } from '../text';
import ProfileAction from './ProfileAction';
import { isAvatarPickerAvailable } from '../../config/experimental';

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'big',
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
  accountColor,
  accountName,
  onPressAvatar,
  emojiCount,
  onPressCopy,
  onPressReceive,
  showBottomDivider,
}) => {
  const name = accountName || '🥰';
  const color = accountColor || 0;

  return (
    <Container>
      {isAvatarPickerAvailable ? (
        <ButtonPressAnimation
          hapticType="impactMedium"
          onPress={onPressAvatar}
          scaleTo={0.82}
        >
          <AvatarCircle style={{ backgroundColor: colors.avatarColor[color] }}>
            <FirstLetter>
              {new GraphemeSplitter().splitGraphemes(name)[0]}
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
        <Column>
          <ProfileAction
            icon="copy"
            onPress={onPressCopy}
            scaleTo={0.82}
            text="Copy Address"
          />
          <FloatingEmojis
            count={emojiCount}
            distance={130}
            emoji="+1"
            size="h2"
          />
        </Column>
        <ProfileAction
          icon="inbox"
          onPress={onPressReceive}
          scaleTo={0.82}
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
  emojiCount: PropTypes.number,
  onPressAvatar: PropTypes.func,
  onPressCopy: PropTypes.func,
  onPressReceive: PropTypes.func,
  showBottomDivider: PropTypes.bool,
};

ProfileMasthead.defaultProps = {
  showBottomDivider: true,
};

export default compose(
  withState('emojiCount', 'setEmojiCount', 0),
  withHandlers({
    onPressAvatar: ({ navigation, accountColor, accountName }) => () =>
      navigation.navigate('AvatarBuilder', {
        accountColor: accountColor,
        accountName: accountName,
      }),
    onPressCopy: ({ accountAddress, emojiCount, setEmojiCount }) => () => {
      setEmojiCount(emojiCount + 1);
      Clipboard.setString(accountAddress);
    },
    onPressReceive: ({ navigation }) => () =>
      navigation.navigate('ReceiveModal'),
  })
)(ProfileMasthead);
