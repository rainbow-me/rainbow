import React, { Fragment } from 'react';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '../../helpers/emojiHandler';
import { abbreviations, magicMemo, profileUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress, TruncatedENS, TruncatedText } from '../text';
import ContactAvatar from './ContactAvatar';
import ImageAvatar from './ImageAvatar';
import {
  isENSAddressFormat,
  isValidDomainFormat,
} from '@rainbow-me/helpers/validators';
import { useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { margin } from '@rainbow-me/styles';

const ContactAddress = styled(TruncatedAddress).attrs(
  ({ theme: { colors }, lite }) => ({
    align: 'left',
    color: colors.alpha(colors.blueGreyDark, 0.5),
    firstSectionLength: 4,
    letterSpacing: 'roundedMedium',
    size: 'smedium',
    truncationLength: 4,
    weight: lite ? 'regular' : 'medium',
  })
)({
  width: '100%',
});

const ContactENS = styled(TruncatedENS).attrs(({ theme: { colors } }) => ({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  truncationLength: 18,
  weight: 'medium',
}))({
  width: '100%',
});

const ContactName = styled(TruncatedText).attrs(({ lite }) => ({
  size: 'lmedium',
  weight: lite ? 'regular' : 'medium',
}))({
  height: 22,
  width: ({ deviceWidth }) => deviceWidth - 90,
});

const css = margin.object(6, 19, 13);

const ContactRow = ({ address, color, nickname, ...props }, ref) => {
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const {
    accountType,
    balance,
    ens,
    image,
    label,
    onPress,
    showcaseItem,
    testID,
  } = props;
  let cleanedUpBalance = balance;
  if (balance === '0.00') {
    cleanedUpBalance = '0';
  }

  // show avatar for contact rows that are accounts, not contacts
  const avatar =
    accountType !== 'contacts'
      ? returnStringFirstEmoji(label) ||
        profileUtils.addressHashedEmoji(address)
      : null;

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label);
  }

  const handlePress = useCallback(() => {
    if (showcaseItem) {
      onPress(showcaseItem);
    } else {
      const label =
        accountType === 'suggestions' && isENSAddressFormat(nickname)
          ? nickname
          : address;
      onPress(label);
    }
  }, [accountType, address, nickname, onPress, showcaseItem]);

  return (
    <ButtonPressAnimation
      exclusive
      isInteraction
      ref={ref}
      scaleTo={0.98}
      {...props}
      onPress={handlePress}
    >
      <RowWithMargins
        height={40}
        margin={10}
        style={css}
        testID={`${testID}-contact-row-${
          removeFirstEmojiFromString(nickname) || ''
        }`}
      >
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
          {accountType === 'accounts' || accountType === 'watching' ? (
            <Fragment>
              {cleanedUpLabel || ens ? (
                <ContactName deviceWidth={deviceWidth}>
                  {cleanedUpLabel || ens}
                </ContactName>
              ) : (
                <ContactName deviceWidth={deviceWidth}>
                  {isValidDomainFormat(address)
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
              <ContactName deviceWidth={deviceWidth} lite={!!showcaseItem}>
                {removeFirstEmojiFromString(nickname)}
              </ContactName>
              {isValidDomainFormat(address) ? (
                <ContactENS ens={address} />
              ) : (
                <ContactAddress address={address} lite={!!showcaseItem} />
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
