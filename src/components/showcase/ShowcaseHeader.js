import React, { createContext, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { RainbowButton } from '../buttons';
import { ColumnWithMargins } from '../layout';
import AvatarCircle from '../profile/AvatarCircle';
import { SheetActionButton } from '../sheet/sheet-action-buttons';
import { TruncatedAddress } from '../text';
import { useDimensions } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';

export const ShowcaseContext = createContext();

const HeaderWrapper = styled.View`
  width: 100%;
  height: 400;
  justify-content: center;
  align-items: center;
`;

const Footer = styled(ColumnWithMargins).attrs({
  margin: 19,
})`
  ${padding(19, 15, 21)};
  width: 100%;
`;

const AddressText = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  lineHeight: 'loosest',
  opacity: 0.6,
  size: 'large',
  weight: 'semibold',
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
    if (!emojiFromContext) {
      return emojiFromContext;
    }
    return popularEmojis[
      Math.abs(
        hashCode(contextValue.address.slice(0, 8)) % popularEmojis.length
      ) % popularEmojis.length
    ];
  }, [contextValue]);

  const color = useMemo(() => {
    const colorFromContext = contextValue?.data?.profile?.accountColor;
    if (!colorFromContext) {
      return colorFromContext;
    }
    return colors.avatarColor[
      Math.abs(
        hashCode(contextValue.address.slice(9, 15)) % colors.avatarColor.length
      ) % colors.avatarColor.length
    ];
  }, [
    colors.avatarColor,
    contextValue.address,
    contextValue?.data?.profile?.accountColor,
  ]);
  return (
    <HeaderWrapper>
      <AvatarCircle
        image={null}
        isAvatarPickerAvailable={false}
        onPress={() => null}
        showcaseAccountColor={color}
        showcaseAccountSymbol={emoji}
      />
      <AddressText address={contextValue.address} />
      <Footer>
        <SheetActionButton
          androidWidth={maxButtonWidth}
          color={color}
          label="SDFSF"
          onPress={() => {}}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
        />
        <SheetActionButton
          androidWidth={maxButtonWidth}
          color={colors.white}
          label="SDFSF"
          onPress={() => {}}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
        />
      </Footer>
    </HeaderWrapper>
  );
}
