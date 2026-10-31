import React, { Fragment, useEffect, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { getAddress } from 'viem';

import { opacity } from '@/design-system/utils/opacity';
import { getNameService } from '@/features/address/core/address';
import { abbreviateAddress } from '@/features/address/core/formatAddress';
import { useEnsImageStore } from '@/features/ens/data/stores/imageStore';
import { useEnsNameStore } from '@/features/ens/data/useEnsNameStore';
import styled from '@/framework/ui/styled-thing';
import useContacts from '@/hooks/useContacts';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { margin } from '@/styles';
import magicMemo from '@/utils/magicMemo';
import profileUtils, { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';

import { removeFirstEmojiFromString, returnStringFirstEmoji } from '../../helpers/emojiHandler';
import { ButtonPressAnimation } from '../animations/ButtonPressAnimation';
import { BottomRowText } from '../coin-row';
import { Column, RowWithMargins } from '../layout';
import { TruncatedAddress, TruncatedENS, TruncatedText } from '../text';
import ContactAvatar from './ContactAvatar';
import ImageAvatar from './ImageAvatar';

const ContactAddress = styled(TruncatedAddress).attrs(({ theme: { colors }, lite }) => ({
  align: 'left',
  color: opacity(colors.blueGreyDark, 0.5),
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
  color: opacity(colors.blueGreyDark, 0.5),
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
  height: Platform.OS === 'ios' ? 22 : 26,
  width: ({ deviceWidth }) => deviceWidth - 90,
});

const css = {
  default: margin.object(6, 19, 13),
  symmetrical: margin.object(9.5, 19),
};

const sx = StyleSheet.create({
  bottomRowText: {
    marginTop: Platform.OS === 'ios' ? 0 : -4.5,
  },
});

const ContactRow = ({ address, color, nickname, symmetricalMargins, ...props }, ref) => {
  const { width: deviceWidth } = useDimensions();
  const { onAddOrUpdateContacts } = useContacts();
  const { colors } = useTheme();
  const { accountType, balances, ens, image, label, onPress, showcaseItem, testID } = props;

  const balanceText = balances ? balances.totalBalanceDisplay : i18n.t(i18n.l.wallet.change_wallet.loading_balance);

  // show avatar for contact rows that are accounts, not contacts
  const avatar = accountType !== 'contacts' ? returnStringFirstEmoji(label) || profileUtils.addressHashedEmoji(address) : null;

  const initialENSName =
    typeof ens === 'string' ? ens : accountType === 'suggestions' && getNameService(nickname) === 'ens' ? nickname : '';

  const resolvedName = useEnsNameStore(s => (accountType === 'contacts' ? s.get(getAddress(address)) : undefined));
  const ensName = resolvedName === undefined ? initialENSName : (resolvedName ?? '');
  const ensAvatar = useEnsImageStore(s => (ensName ? s.get({ name: ensName, field: 'avatar' }) : undefined));

  useEffect(() => {
    if (resolvedName === undefined || ensName === initialENSName) return;
    onAddOrUpdateContacts(address, nickname === initialENSName ? ensName : nickname, color, ensName);
  }, [resolvedName, ensName, initialENSName, onAddOrUpdateContacts, address, nickname, color]);

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label);
  }

  const handlePress = useCallback(() => {
    if (showcaseItem) {
      onPress(showcaseItem, nickname);
    } else {
      const recipient = accountType === 'suggestions' && getNameService(nickname) === 'ens' ? nickname : address;
      onPress(recipient, nickname ?? recipient);
    }
  }, [accountType, address, nickname, onPress, showcaseItem]);

  const imageAvatar = ensAvatar ?? image;

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
        <Column justify={Platform.OS === 'ios' ? 'space-between' : 'center'}>
          {accountType === 'accounts' || accountType === 'watching' ? (
            <Fragment>
              {cleanedUpLabel || ens ? (
                <ContactName deviceWidth={deviceWidth}>{cleanedUpLabel || ens}</ContactName>
              ) : (
                <ContactName deviceWidth={deviceWidth}>{getNameService(address) ? address : abbreviateAddress(address, 4, 6)}</ContactName>
              )}
              <BottomRowText
                style={sx.bottomRowText}
                color={opacity(colors.blueGreyDark, 0.5)}
                letterSpacing="roundedMedium"
                weight="medium"
              >
                {balanceText}
              </BottomRowText>
            </Fragment>
          ) : (
            <Fragment>
              <ContactName deviceWidth={deviceWidth} lite={!!showcaseItem}>
                {removeFirstEmojiFromString(nickname)}
              </ContactName>
              {getNameService(address) ? <ContactENS ens={address} /> : <ContactAddress address={address} lite={!!showcaseItem} />}
            </Fragment>
          )}
        </Column>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

export default magicMemo(React.forwardRef(ContactRow), ['address', 'color', 'nickname']);
