import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '../../helpers/emojiHandler';
import { abbreviations, magicMemo, profileUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress, TruncatedENS, TruncatedText } from '../text';
import ContactAvatar from './ContactAvatar';
import ImageAvatar from './ImageAvatar';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { fetchReverseRecord } from '@/handlers/ens';
import { ENS_DOMAIN } from '@/helpers/ens';
import { isENSAddressFormat, isValidDomainFormat } from '@/helpers/validators';
import { useAccountSettings, useContacts, useDimensions, useENSAvatar } from '@/hooks';
import styled from '@/styled-thing';
import { margin } from '@/styles';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import * as i18n from '@/languages';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';

const ContactAddress = styled(TruncatedAddress).attrs(({ theme: { colors }, lite }) => ({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  firstSectionLength: 4,
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  truncationLength: 4,
  weight: lite ? 'regular' : 'medium',
}))({
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

const ContactRow = ({ address, color, nickname, symmetricalMargins, ...props }, ref) => {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { width: deviceWidth } = useDimensions();
  const { onAddOrUpdateContacts } = useContacts();
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();
  const { accountType, balance, ens, image, label, network, onPress, showcaseItem, testID } = props;

  const cleanedUpBalance = useMemo(() => {
    if (balance) {
      return convertAmountToNativeDisplay(balance, nativeCurrency);
    } else {
      return i18n.t(i18n.l.wallet.change_wallet.no_balance);
    }
  }, [balance, nativeCurrency]);

  // show avatar for contact rows that are accounts, not contacts
  const avatar = accountType !== 'contacts' ? returnStringFirstEmoji(label) || profileUtils.addressHashedEmoji(address) : null;

  // if the accountType === 'suggestions', nickname will always be an ens or hex address, not a custom contact nickname
  const initialENSName = typeof ens === 'string' ? ens : nickname?.includes(ENS_DOMAIN) ? nickname : '';

  const [ensName, setENSName] = useState(initialENSName);

  const { data: ensAvatar } = useENSAvatar(ensName, {
    enabled: profilesEnabled && Boolean(ensName),
  });

  useEffect(() => {
    if (profilesEnabled && accountType === 'contacts') {
      const fetchENSName = async () => {
        const name = await fetchReverseRecord(address);
        if (name !== ensName) {
          setENSName(name);
          onAddOrUpdateContacts(address, name && isENSAddressFormat(nickname) ? name : nickname, color, network, name);
        }
      };
      fetchENSName();
    }
  }, [accountType, onAddOrUpdateContacts, address, color, ensName, network, nickname, profilesEnabled, setENSName]);

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label);
  }

  const handlePress = useCallback(() => {
    if (showcaseItem) {
      onPress(showcaseItem, nickname);
    } else {
      const recipient = accountType === 'suggestions' && isENSAddressFormat(nickname) ? nickname : ensName || address;
      onPress(recipient, nickname ?? recipient);
    }
  }, [accountType, address, ensName, nickname, onPress, showcaseItem]);

  const imageAvatar = profilesEnabled ? ensAvatar?.imageUrl : image;

  const emoji = useMemo(() => (address ? addressHashedEmoji(address) : ''), [address]);
  const emojiAvatar = avatar || emoji || nickname || label;

  const colorIndex = useMemo(() => (address ? addressHashedColorIndex(address) : 0), [address]);
  const bgColor = color ?? colors.avatarBackgrounds[colorIndex || 0];

  return (
    <ButtonPressAnimation exclusive isInteraction ref={ref} scaleTo={0.98} {...props} onPress={handlePress}>
      <RowWithMargins
        height={40}
        margin={10}
        style={symmetricalMargins ? css.symmetrical : css.default}
        testID={`${testID}-contact-row-${removeFirstEmojiFromString(nickname) || ''}`}
      >
        {imageAvatar ? (
          <ImageAvatar image={imageAvatar} marginRight={10} size="medium" />
        ) : (
          <ContactAvatar color={bgColor} marginRight={10} size="medium" value={emojiAvatar} />
        )}
        <Column justify={ios ? 'space-between' : 'center'}>
          {accountType === 'accounts' || accountType === 'watching' ? (
            <Fragment>
              {cleanedUpLabel || ens ? (
                <ContactName deviceWidth={deviceWidth}>{cleanedUpLabel || ens}</ContactName>
              ) : (
                <ContactName deviceWidth={deviceWidth}>
                  {isValidDomainFormat(address) ? address : abbreviations.address(address, 4, 6)}
                </ContactName>
              )}
              <BottomRowText color={colors.alpha(colors.blueGreyDark, 0.5)} letterSpacing="roundedMedium" weight="medium">
                {cleanedUpBalance}
              </BottomRowText>
            </Fragment>
          ) : (
            <Fragment>
              <ContactName deviceWidth={deviceWidth} lite={!!showcaseItem}>
                {removeFirstEmojiFromString(nickname)}
              </ContactName>
              {isValidDomainFormat(address) ? <ContactENS ens={address} /> : <ContactAddress address={address} lite={!!showcaseItem} />}
            </Fragment>
          )}
        </Column>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

export default magicMemo(React.forwardRef(ContactRow), ['address', 'color', 'nickname']);
