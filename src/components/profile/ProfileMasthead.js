import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard } from 'react-native';
import FastImage from 'react-native-fast-image';
import { compose, onlyUpdateForKeys, withHandlers, withState } from 'recompact';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import { borders, margin } from '../../styles';
import { abbreviations } from '../../utils';
import CopyTooltip from '../CopyTooltip';
import Divider from '../Divider';
import { Centered, Column, RowWithMargins } from '../layout';
import { FloatingEmojis } from '../floating-emojis';
import { TruncatedAddress } from '../text';
import ProfileAction from './ProfileAction';

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

const ProfileMasthead = ({
  accountAddress,
  emojiCount,
  onPressCopy,
  onPressReceive,
  showBottomDivider,
}) => (
  <Container>
    <FastImage
      source={AvatarImageSource}
      style={{
        ...borders.buildCircleAsObject(85),
        marginBottom: 3,
      }}
    />
    <CopyTooltip textToCopy={accountAddress} tooltipText="Copy Address">
      <AddressAbbreviation address={accountAddress} />
    </CopyTooltip>
    <RowWithMargins align="center" margin={1}>
      <Column>
        <ProfileAction
          icon="copy"
          onPress={onPressCopy}
          scaleTo={0.88}
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
        scaleTo={1.1}
        text="Receive"
      />
    </RowWithMargins>
    {showBottomDivider && (
      <Divider style={{ bottom: 0, position: 'absolute' }} />
    )}
  </Container>
);

ProfileMasthead.propTypes = {
  accountAddress: PropTypes.string,
  emojiCount: PropTypes.number,
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
    onPressCopy: ({ accountAddress, emojiCount, setEmojiCount }) => () => {
      setEmojiCount(emojiCount + 1);
      Clipboard.setString(accountAddress);
    },
    onPressReceive: ({ navigation }) => () =>
      navigation.navigate('ReceiveModal'),
  }),
  onlyUpdateForKeys(['accountAddress', 'emojiCount', 'showBottomDivider'])
)(ProfileMasthead);
