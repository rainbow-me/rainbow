import { withSafeTimeout } from '@hocs/safe-timers';
import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Animated,
  Clipboard,
  Dimensions,
  Image,
  View,
  TouchableOpacity,
  Share,
} from 'react-native';
import { compose, onlyUpdateForKeys, withHandlers, withState } from 'recompact';
import styled from 'styled-components';

import { AssetList } from './asset-list';
import { UniqueTokenRow } from './unique-token';
import { BalanceCoinRow } from './coin-row';
import {
  ActivityHeaderButton,
  Header,
  HeaderButton,
} from './header';
import { Centered, FlexItem, Page, Column, Row } from './layout';
import { FabWrapper, WalletConnectFab, SendFab } from './fab';
import { Text, TruncatedAddress } from './text';
import Icon from './icons/Icon';
import {
  areAssetsEqualToInitialAccountAssetsState,
  buildUniqueTokenList,
  groupAssetsByMarketValue,
  sortAssetsByNativeAmount,
} from '../helpers/assets';
import {
  withAccountAddress,
  withAccountAssets,
  withHideSplashScreen,
  withRequestsInit,
} from '../hoc';
import { margin, padding, position, colors } from '../styles';
import Avatar from '../assets/avatar.png';
import Divider from './Divider';

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${padding(5, 0, 50)}
  height: 230;
  margin-bottom: 15;
`;

const Address = styled(TruncatedAddress).attrs({
  size: 'big',
  weight: 'bold',
  truncationLength: 4,
})`
  margin-bottom: 5;
`;
const AvatarImage = styled(Image).attrs({
  source: Avatar,
})`
  height: 85px;
  width: 85px;
  border-radius: 32;
`;

const ProfileActionText = styled(Text).attrs({
  color: colors.appleBlue,
  size: 'medium',
  weight: 'semibold',
})`
  margin-left: 5;
  margin-right: 16;
`;

const ProfileAction = ({
  icon,
  maxHeight = 16,
  onPress,
  text,
}) => (
  <TouchableOpacity onPress={onPress}>
    <Row align="center">
      <Icon
        color={colors.appleBlue}
        name={icon}
        style={{ maxHeight }}
      />
      <ProfileActionText>{text}</ProfileActionText>
    </Row>
  </TouchableOpacity>
);

ProfileAction.propTypes = {
  icon: Icon.propTypes.name,
  maxHeight: PropTypes.number,
  onPress: PropTypes.func,
  text: PropTypes.string,
};

const ProfileMasthead = ({
  accountAddress,
  onPressCopy,
  onPressShare,
}) => (
  <Container>
    <AvatarImage />
    <Address address={accountAddress} />
    <Row>
      <ProfileAction
        icon="copy"
        onPress={onPressCopy}
        text="Copy address"
      />
      <ProfileAction
        icon="share"
        maxHeight={17}
        onPress={onPressShare}
        text="Share"
      />
    </Row>
    <Divider style={{ position: 'absolute', bottom: 0 }} />
  </Container>
);

ProfileMasthead.propTypes = {
  accountAddress: PropTypes.string,
  onPressCopy: PropTypes.func,
  onPressShare: PropTypes.func,
};

export default compose(
  withHandlers({
    onPressCopy: ({ accountAddress }) => () => Clipboard.setString(accountAddress),
    onPressShare: ({ accountAddress }) => () =>
      Share.share({
        message: accountAddress,
        title: 'My account address',
      }),
  }),
)(ProfileMasthead);
