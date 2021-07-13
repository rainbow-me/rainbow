import React, { Fragment } from 'react';
import styled from 'styled-components';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '../../helpers/emojiHandler';
import { abbreviations, defaultProfileUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress, TruncatedENS, TruncatedText } from '../text';
import ContactAvatar from './ContactAvatar';
import ImageAvatar from './ImageAvatar';
import { isENSAddressFormat } from '@rainbow-me/helpers/validators';
import { useDimensions } from '@rainbow-me/hooks';
import { margin } from '@rainbow-me/styles';

const ContactAddress = styled(TruncatedAddress).attrs(
  ({ theme: { colors } }) => ({
    align: 'left',
    color: colors.alpha(colors.blueGreyDark, 0.5),
    firstSectionLength: 4,
    letterSpacing: 'roundedMedium',
    size: 'smedium',
    truncationLength: 4,
    weight: 'medium',
  })
)`
  width: 100%;
`;

const ContactENS = styled(TruncatedENS).attrs(({ theme: { colors } }) => ({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  truncationLength: 18,
  weight: 'medium',
}))`
  width: 100%;
`;

const ContactName = styled(TruncatedText).attrs({
  size: 'lmedium',
  weight: 'medium',
})`
  width: ${({ deviceWidth }) => deviceWidth - 90};
  height: 22;
`;

const ContactRow = ({ address, color, nickname, ...props }, ref) => {
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const { accountType, balance, ens, image, label, onPress } = props;
  let cleanedUpBalance = balance;
  if (balance === '0.00') {
    cleanedUpBalance = '0';
  }

  // show avatar for contact rows that are accounts, not contacts
  const avatar =
    accountType !== 'contacts'
      ? returnStringFirstEmoji(label) ||
        defaultProfileUtils.addressHashedEmoji(address)
      : null;

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label).join('');
  }

  const handlePress = useCallback(() => onPress(address), [address, onPress]);

  return (
    <ButtonPressAnimation
      exclusive
      isInteraction
      ref={ref}
      scaleTo={0.98}
      {...props}
      onPress={handlePress}
    >
      <RowWithMargins css={margin(6, 19, 13)} height={40} margin={10}>
        {image ? (
          <ImageAvatar image={image} marginRight={10} size="medium" />
        ) : (
          <ContactAvatar
            color={color}
            marginRight={10}
            size="medium"
            value={avatar || nickname || label || ens}
          />
        )}
        <Column justify={ios ? 'space-between' : 'center'}>
          {accountType === 'accounts' ? (
            <Fragment>
              {cleanedUpLabel || ens ? (
                <ContactName deviceWidth={deviceWidth}>
                  {cleanedUpLabel || ens}
                </ContactName>
              ) : (
                <ContactName deviceWidth={deviceWidth}>
                  {isENSAddressFormat(address)
                    ? address
                    : abbreviations.address(address, 4, 6)}
                </ContactName>
              )}
              <BottomRowText
                color={colors.alpha(colors.blueGreyDark, 0.5)}
                letterSpacing="roundedMedium"
                weight="medium"
              >
                {cleanedUpBalance || 0} ETH
              </BottomRowText>
            </Fragment>
          ) : (
            <Fragment>
              <ContactName deviceWidth={deviceWidth}>
                {removeFirstEmojiFromString(nickname)}
              </ContactName>
              {isENSAddressFormat(address) ? (
                <ContactENS ens={address} />
              ) : (
                <ContactAddress address={address} />
              )}
            </Fragment>
          )}
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
