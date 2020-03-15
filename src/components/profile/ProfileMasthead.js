import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers } from 'recompact';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import { margin, borders } from '../../styles';
import { abbreviations } from '../../utils';
import { useNavigation } from 'react-navigation-hooks';
import { useClipboard } from '../../hooks';
import CopyTooltip from '../copy-tooltip';
import Divider from '../Divider';
import { Centered, RowWithMargins } from '../layout';
import { FloatingEmojis } from '../floating-emojis';
import { TruncatedAddress } from '../text';
import ProfileAction from './ProfileAction';
import { isAvatarPickerAvailable } from '../../config/experimental';
import AvatarCircle from './AvatarCircle';

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
  showBottomDivider,
  onPressAvatar,
}) => {
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();

  return (
    <Container>
      {isAvatarPickerAvailable ? (
        <AvatarCircle onPress={onPressAvatar} />
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
