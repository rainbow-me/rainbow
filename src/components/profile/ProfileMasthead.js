import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard } from 'react-native';
import FastImage from 'react-native-fast-image';
import { compose, onlyUpdateForKeys, setStatic, withHandlers } from 'recompact';
import styled from 'styled-components';
import AvatarImageSource from '../../assets/avatar.png';
import { borders, margin } from '../../styles';
import { abbreviations } from '../../utils';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress } from '../text';
import Divider from '../Divider';
import ProfileAction from './ProfileAction';

const ProfileMastheadHeight = 184;

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'big',
  truncationLength: 4,
  weight: 'bold',
})`
  ${margin(1, 0, 11)}
  text-align: center;
  width: 100%;
`;

const ProfileMasthead = ({
  accountAddress,
  onPressCopy,
  onPressReceive,
  showBottomDivider,
}) => (
  <Column
    align="center"
    justify="start"
    style={{ height: ProfileMastheadHeight }}
  >
    <FastImage
      source={AvatarImageSource}
      style={borders.buildCircleAsObject(85)}
    />
    <AddressAbbreviation address={accountAddress} />
    <RowWithMargins align="center">
      <ProfileAction
        icon="copy"
        onPress={onPressCopy}
        text="Copy"
      />
      <ProfileAction
        icon="inbox"
        onPress={onPressReceive}
        text="Receive"
      />
    </RowWithMargins>
    {showBottomDivider && <Divider style={{ position: 'absolute', bottom: 0 }} />}
  </Column>
);

ProfileMasthead.propTypes = {
  accountAddress: PropTypes.string,
  onPressCopy: PropTypes.func,
  onPressReceive: PropTypes.func,
  showBottomDivider: PropTypes.bool,
};

ProfileMasthead.defaultProps = {
  showBottomDivider: true,
};

export default compose(
  setStatic({ height: ProfileMastheadHeight }),
  withHandlers({
    onPressCopy: ({ accountAddress }) => () => Clipboard.setString(accountAddress),
    onPressReceive: ({ navigation }) => () => navigation.navigate('ReceiveModal'),
  }),
  onlyUpdateForKeys(['accountAddress', 'showBottomDivider']),
)(ProfileMasthead);
