import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import AvatarImageSource from '../../assets/avatar.png';
import { useClipboard } from '../../hooks';
import { borders, margin } from '../../styles';
import { abbreviations, isNewValueForObjectPaths } from '../../utils';
import CopyTooltip from '../copy-tooltip';
import Divider from '../Divider';
import { Centered, RowWithMargins } from '../layout';
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

const ProfileMasthead = ({ accountAddress, showBottomDivider }) => {
  const { setClipboard } = useClipboard();
  const { navigate } = useNavigation();

  return (
    <Centered direction="column" marginBottom={24} paddingBottom={32}>
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

const arePropsEqual = (...props) =>
  !isNewValueForObjectPaths(...props, ['accountAddress', 'showBottomDivider']);

export default React.memo(ProfileMasthead, arePropsEqual);
