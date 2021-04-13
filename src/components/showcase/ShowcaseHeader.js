import React, { createContext, useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { useImportingWallet } from '../../screens/ImportSeedPhraseSheet';
import { ColumnWithMargins } from '../layout';
import AvatarCircle from '../profile/AvatarCircle';
import SheetHandle from '../sheet/SheetHandle';
import { SheetActionButton } from '../sheet/sheet-action-buttons';
import { Text, TruncatedAddress } from '../text';
import { getContacts } from '@rainbow-me/handlers/localstorage/contacts';
import { useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';

export const ShowcaseContext = createContext();

const HeaderWrapper = styled.View`
  width: 100%;
  height: 330;
  padding-top: 40;
  justify-content: center;
  align-items: center;
`;

const Footer = styled(ColumnWithMargins).attrs({
  margin: 19,
})`
  ${padding(19, 15, 21)};
  width: 100%;
`;

const Spacer = styled.View`
  height: 19;
`;

const ButtonSpacer = styled.View`
  height: 0;
`;

const AddressText = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark,
  lineHeight: 'loosest',
  opacity: 0.6,
  size: 'large',
  weight: 'heavy',
}))`
  width: 100%;
`;

const ENSAddress = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.dark,
  lineHeight: 'loosest',
  size: 'larger',
  weight: 'heavy',
}))`
  width: 100%;
`;

const popularEmojis = ['🥺', '❤️', '🤣', '✨', '😍', '🥰', '😊'];

function hashCode(text) {
  let hash = 0,
    i,
    chr;
  if (text.length === 0) return hash;
  for (i = 0; i < text.length; i++) {
    chr = text.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

export function Header() {
  const { width: deviceWidth } = useDimensions();
  const maxButtonWidth = deviceWidth - 30;

  const contextValue = useContext(ShowcaseContext);

  const { colors } = useTheme();
  const emoji = useMemo(() => {
    const emojiFromContext = contextValue?.data?.profile?.accountSymbol;
    if (emojiFromContext) {
      return emojiFromContext;
    }
    return popularEmojis[
      Math.abs(
        hashCode(contextValue?.address?.slice(0, 8)) % popularEmojis.length
      ) % popularEmojis.length
    ];
  }, [contextValue]);

  const color = useMemo(() => {
    const colorFromContext = contextValue?.data?.profile?.accountColor;
    if (colorFromContext) {
      return colorFromContext;
    }
    return colors.avatarColor[
      Math.abs(
        hashCode(contextValue?.address?.slice(9, 15)) %
          colors.avatarColor.length
      ) % colors.avatarColor.length
    ];
  }, [
    colors.avatarColor,
    contextValue.address,
    contextValue?.data?.profile?.accountColor,
  ]);

  const { navigate } = useNavigation();

  const onAddToContact = useCallback(async () => {
    const contacts = await getContacts();
    const currentContact = contacts[contextValue?.address];

    navigate(Routes.MODAL_SCREEN, {
      address: contextValue?.address,
      color,
      contact: currentContact || {
        address: contextValue?.address,
        color,
        nickname: contextValue?.ensName,
        temporary: true,
      },
      type: 'contact_profile',
    });
  }, [color, contextValue?.address, contextValue?.ensName, navigate]);

  const { handlePressImportButton } = useImportingWallet();

  const onWatchAddress = useCallback(() => {
    handlePressImportButton(color, contextValue.address);
  }, [color, contextValue.address, handlePressImportButton]);

  return (
    <HeaderWrapper>
      <SheetHandle />
      <Spacer />
      <AvatarCircle
        image={null}
        isAvatarPickerAvailable={false}
        onPress={() => {}}
        showcaseAccountColor={color}
        showcaseAccountSymbol={emoji}
      />
      {contextValue?.ensName && (
        <ENSAddress>{contextValue?.ensName}</ENSAddress>
      )}
      <AddressText address={contextValue.address} />
      <Footer>
        <SheetActionButton
          androidWidth={maxButtonWidth}
          color={color}
          label=" 􀜖 Add to Contacts "
          onPress={onAddToContact}
          size="big"
          textColor={colors.whiteLabel}
          weight="heavy"
        />
        {android && <ButtonSpacer />}
        <SheetActionButton
          androidWidth={maxButtonWidth}
          color={colors.blueGreyDark30}
          label="􀨭 Watch this Wallet"
          onPress={onWatchAddress}
          size="big"
          textColor={colors.whiteLabel}
          weight="heavy"
        />
      </Footer>
    </HeaderWrapper>
  );
}
