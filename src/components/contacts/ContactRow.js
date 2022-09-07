import React, { Fragment, useEffect } from 'react';
import { abbreviations, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress, TruncatedENS, TruncatedText } from '../text';
import ContactAvatar from './ContactAvatar';
import ImageAvatar from './ImageAvatar';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { isENSAddressFormat, isValidDomainFormat } from '@/helpers/validators';
import {
  useContacts,
  useDimensions,
  useENSAvatar,
  useENSName,
  useRainbowProfile,
} from '@/hooks';
import styled from '@/styled-thing';
import { margin } from '@/styles';

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

const css = {
  default: margin.object(6, 19, 13),
  symmetrical: margin.object(9.5, 19),
};

const ContactRow = (
  { address, nickname, symmetricalMargins, ...props },
  ref
) => {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { width: deviceWidth } = useDimensions();
  const { onAddOrUpdateContacts } = useContacts();
  const { colors } = useTheme();
  const {
    accountType,
    balance,
    color,
    emoji,
    image,
    label,
    network,
    onPress,
    showcaseItem,
    testID,
  } = props;

  let cleanedUpBalance = balance;
  if (balance === '0.00') {
    cleanedUpBalance = '0';
  }

  const { data: ensName } = useENSName(address);

  const { data: ensAvatar } = useENSAvatar(ensName, {
    enabled: profilesEnabled && Boolean(ensName),
  });

  const { rainbowProfile } = useRainbowProfile(address);

  useEffect(() => {
    if (
      accountType === 'contacts' &&
      ensName &&
      ensName !== nickname &&
      isENSAddressFormat(nickname)
    ) {
      onAddOrUpdateContacts(address, nickname, network);
    }
  }, [accountType, address, ensName, network, nickname, onAddOrUpdateContacts]);

  const handlePress = useCallback(() => {
    if (showcaseItem) {
      onPress(showcaseItem);
    } else {
      const recipient =
        accountType === 'suggestions' && isENSAddressFormat(nickname)
          ? nickname
          : ensName || address;
      const contactNickname = accountType === 'contacts' ? nickname : '';
      onPress(recipient, contactNickname);
    }
  }, [accountType, address, ensName, nickname, onPress, showcaseItem]);

  const imageAvatar = ensAvatar?.imageUrl || image;

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
        style={symmetricalMargins ? css.symmetrical : css.default}
        testID={`${testID}-contact-row-${nickname || ''}`}
      >
        {imageAvatar ? (
          <ImageAvatar image={imageAvatar} marginRight={10} size="medium" />
        ) : (
          <ContactAvatar
            address={address}
            color={color || rainbowProfile?.color}
            emoji={emoji || rainbowProfile?.emoji}
            marginRight={10}
            size="medium"
          />
        )}
        <Column justify={ios ? 'space-between' : 'center'}>
          {accountType === 'accounts' || accountType === 'watching' ? (
            <Fragment>
              {label || ensName ? (
                <ContactName deviceWidth={deviceWidth}>
                  {label || ensName}
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
                {nickname}
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
