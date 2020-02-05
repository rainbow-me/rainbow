import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes, withProps } from 'recompact';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import { colors, margin } from '../../styles';
import { abbreviations, deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, RowWithMargins } from '../layout';
import { Text, TruncatedAddress } from '../text';
import ContactAvatar from './ContactAvatar';

const TruncatedContactAddress = withProps({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  size: 'smedium',
  weight: 'regular',
  width: '100%',
})(TruncatedAddress);

const ContactRow = ({ address, color, nickname, ...props }) => (
  <ButtonPressAnimation exclusive isInteraction scaleTo={0.98} {...props}>
    <RowWithMargins css={margin(17, 15, 5)} height={40} margin={10}>
      <ContactAvatar color={color} value={nickname} />
      <Column justify="space-between">
        <Text
          letterSpacing="tight"
          numberOfLines={1}
          size="lmedium"
          weight="medium"
          width={deviceUtils.dimensions.width - 90}
        >
          {removeFirstEmojiFromString(nickname)}
        </Text>
        <TruncatedContactAddress
          address={address}
          firstSectionLength={abbreviations.defaultNumCharsPerSection}
          truncationLength={4}
        />
      </Column>
    </RowWithMargins>
  </ButtonPressAnimation>
);

ContactRow.propTypes = {
  address: PropTypes.string,
  color: PropTypes.number,
  nickname: PropTypes.string,
};

export default onlyUpdateForPropTypes(ContactRow);
