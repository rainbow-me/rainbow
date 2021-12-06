import React, { Fragment } from 'react';
import styled from 'styled-components';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '../../helpers/emojiHandler';
import { abbreviations, magicMemo, profileUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress, TruncatedENS, TruncatedText } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ContactAvatar' was resolved to '/Users/n... Remove this comment to see the full error message
import ContactAvatar from './ContactAvatar';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ImageAvatar' was resolved to '/Users/nic... Remove this comment to see the full error message
import ImageAvatar from './ImageAvatar';
import {
  isENSAddressFormat,
  isValidDomainFormat,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
} from '@rainbow-me/helpers/validators';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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

const ContactName = styled(TruncatedText).attrs(({ lite }) => ({
  size: 'lmedium',
  weight: lite ? 'regular' : 'medium',
}))`
  width: ${({ deviceWidth }) => deviceWidth - 90};
  height: 22;
`;

const ContactRow = ({ address, color, nickname, ...props }: any, ref: any) => {
  const { width: deviceWidth } = useDimensions();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      exclusive
      isInteraction
      ref={ref}
      scaleTo={0.98}
      {...props}
      onPress={handlePress}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins
        css={margin(6, 19, 13)}
        height={40}
        margin={10}
        testID={`${testID}-contact-row-${
          removeFirstEmojiFromString(nickname) || ''
        }`}
      >
        {image ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ImageAvatar image={image} marginRight={10} size="medium" />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ContactAvatar
            color={color}
            marginRight={10}
            size="medium"
            value={avatar || nickname || label || ens}
          />
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column justify={ios ? 'space-between' : 'center'}>
          {accountType === 'accounts' || accountType === 'watching' ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Fragment>
              {cleanedUpLabel || ens ? (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ContactName deviceWidth={deviceWidth}>
                  {cleanedUpLabel || ens}
                </ContactName>
              ) : (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ContactName deviceWidth={deviceWidth}>
                  {isValidDomainFormat(address)
                    ? address
                    : abbreviations.address(address, 4, 6)}
                </ContactName>
              )}
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <BottomRowText
                color={colors.alpha(colors.blueGreyDark, 0.5)}
                letterSpacing="roundedMedium"
                weight="medium"
              >
                {cleanedUpBalance || 0} ETH
              </BottomRowText>
            </Fragment>
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Fragment>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ContactName deviceWidth={deviceWidth} lite={!!showcaseItem}>
                {removeFirstEmojiFromString(nickname)}
              </ContactName>
              {isValidDomainFormat(address) ? (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ContactENS ens={address} />
              ) : (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ContactAddress address={address} lite={!!showcaseItem} />
              )}
            </Fragment>
          )}
        </Column>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(React.forwardRef(ContactRow), [
  'address',
  'color',
  'nickname',
]);
