import PropTypes from 'prop-types';
import React from 'react';
import { View, Text } from 'react-native';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import GraphemeSplitter from 'grapheme-splitter';
import styled from 'styled-components/primitives';
import { withRequests, withAccountInfo } from '../../hoc';
import { Badge } from '../badge';
import { Centered } from '../layout';
import Avatar from '../Avatar';
import HeaderButton from './HeaderButton';
import { colors } from '../../styles';

const AvatarCircle = styled(View)`
  border-radius: 17px;
  margin-bottom: 16px;
  height: 34px;
  width: 34px;
  position: absolute;
  z-index: 10;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 24;
  line-height: 34;
`;

const ProfileHeaderButton = ({
  accountColor,
  accountName,
  onPress,
  pendingRequestCount,
}) => (
  <HeaderButton
    testID="goToProfile"
    onPress={onPress}
    shouldRasterizeIOS
    transformOrigin="left"
  >
    <Centered>
      <AvatarCircle
        style={{ backgroundColor: colors.avatarColor[accountColor] }}
      >
        <FirstLetter>
          {new GraphemeSplitter().splitGraphemes(accountName)[0]}
        </FirstLetter>
      </AvatarCircle>
      <Avatar size={34} />
      {pendingRequestCount > 0 && (
        <Badge delay={1500} value={pendingRequestCount} zIndex={1} />
      )}
    </Centered>
  </HeaderButton>
);

ProfileHeaderButton.propTypes = {
  onPress: PropTypes.func,
  pendingRequestCount: PropTypes.number,
};

export default compose(
  withAccountInfo,
  withRequests,
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('ProfileScreen'),
  }),
  onlyUpdateForKeys(['pendingRequestCount', 'accountColor', 'accountName'])
)(ProfileHeaderButton);
