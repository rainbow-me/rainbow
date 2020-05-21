import React from 'react';
import styled from 'styled-components/primitives';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import { useDimensions } from '../../hooks';
import { colors, margin } from '../../styles';
import { abbreviations, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress, TruncatedText } from '../text';
import ContactAvatar from './ContactAvatar';

const ContactAddress = styled(TruncatedAddress).attrs({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'smedium',
  truncationLength: 4,
  weight: 'regular',
})`
  width: 100%;
`;

const ContactName = styled(TruncatedText).attrs({
  size: 'lmedium',
  weight: 'medium',
})`
  width: ${({ deviceWidth }) => deviceWidth - 90};
`;

const ContactRow = ({ address, color, nickname, ...props }, ref) => {
  const { width: deviceWidth } = useDimensions();

  return (
    <ButtonPressAnimation
      exclusive
      isInteraction
      ref={ref}
      scaleTo={0.98}
      {...props}
    >
      <RowWithMargins css={margin(17, 15, 5)} height={40} margin={10}>
        <ContactAvatar color={color} size="medium" value={nickname} />
        <Column justify="space-between">
          <ContactName deviceWidth={deviceWidth}>
            {removeFirstEmojiFromString(nickname)}
          </ContactName>
          <ContactAddress address={address} />
        </Column>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

export default magicMemo(React.forwardRef(ContactRow), [
  'address',
  'color',
  'nickname',
]);
