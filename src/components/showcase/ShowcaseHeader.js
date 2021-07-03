import React, { createContext, useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import AvatarCircle from '../profile/AvatarCircle';
import SheetHandle from '../sheet/SheetHandle';
import {
  SheetActionButton,
  SheetActionButtonRow,
} from '../sheet/sheet-action-buttons';
import { Text, TruncatedAddress } from '../text';
import { getContacts } from '@rainbow-me/handlers/localstorage/contacts';
import { isHexString } from '@rainbow-me/handlers/web3';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import {
  useDimensions,
  useImportingWallet,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors, padding } from '@rainbow-me/styles';
import { abbreviations, defaultProfileUtils } from '@rainbow-me/utils';

export const ShowcaseContext = createContext();

const HeaderWrapper = styled.View`
  width: 100%;
  padding-top: 40;
  justify-content: center;
  align-items: center;
  height: ${({ height }) => height};
`;

const Footer = styled(ColumnWithMargins).attrs({
  margin: 19,
})`
  ${padding(19, 0, 21)};
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
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
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

const avatarColor = defaultProfileUtils.emojiColorIndexes.map(
  idx => colors.avatarBackgrounds[idx]
);

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
  const maxButtonWidth = deviceWidth - 50;
  const { goBack, navigate } = useNavigation();
  const contextValue = useContext(ShowcaseContext);
  const { isReadOnlyWallet } = useWallets();

  const { colors } = useTheme();

  const hash = Math.abs(hashCode(contextValue?.address?.toLowerCase()) % 35);

  const emoji = useMemo(() => {
    const emojiFromContext = contextValue?.data?.profile?.accountSymbol;
    if (emojiFromContext) {
      return emojiFromContext;
    }
    return defaultProfileUtils.popularEmojis[hash];
  }, [contextValue?.data?.profile?.accountSymbol, hash]);

  const color = useMemo(() => {
    const colorFromContext = contextValue?.data?.profile?.accountColor;
    if (colorFromContext) {
      return colorFromContext;
    }
    return avatarColor[hash];
  }, [contextValue?.data?.profile?.accountColor, hash]);

  const onAddToContact = useCallback(async () => {
    const contacts = await getContacts();
    const currentContact = contacts[contextValue?.address];

    navigate(Routes.MODAL_SCREEN, {
      address: contextValue?.address,
      color,
      contact: currentContact || {
        address: contextValue?.address,
        color,
        nickname: contextValue?.data?.reverseEns,
        temporary: true,
      },
      type: 'contact_profile',
    });
  }, [color, contextValue?.address, contextValue?.data?.reverseEns, navigate]);

  const onSend = useCallback(async () => {
    goBack();
    if (isNativeStackAvailable || android) {
      navigate(Routes.SEND_FLOW, {
        params: { address: contextValue?.address },
        screen: Routes.SEND_SHEET,
      });
    } else {
      navigate(Routes.SEND_FLOW, { address: contextValue?.address });
    }
  }, [contextValue?.address, goBack, navigate]);

  const { handleSetSeedPhrase, handlePressImportButton } = useImportingWallet();

  const onWatchAddress = useCallback(() => {
    handleSetSeedPhrase(contextValue.address);
    handlePressImportButton(
      color,
      contextValue.address,
      contextValue?.data?.profile?.accountSymbol
    );
  }, [
    color,
    contextValue.address,
    handlePressImportButton,
    handleSetSeedPhrase,
    contextValue?.data?.profile?.accountSymbol,
  ]);

  const mainText =
    contextValue?.data?.reverseEns ||
    contextValue?.addressOrDomain?.toLowerCase();

  const secondaryText =
    contextValue?.address?.toLowerCase() === mainText
      ? null
      : contextValue?.address?.toLowerCase();

  return (
    <HeaderWrapper height={350}>
      <SheetHandle />
      <Spacer />
      <AvatarCircle
        image={null}
        isAvatarPickerAvailable={false}
        onPress={() => {}}
        showcaseAccountColor={color}
        showcaseAccountSymbol={emoji}
      />
      <ENSAddress
        address={mainText}
        as={isHexString(mainText) && TruncatedAddress}
      >
        {mainText}
      </ENSAddress>
      {secondaryText && <AddressText address={secondaryText} />}
      <Footer>
        <SheetActionButtonRow ignorePaddingBottom>
          <SheetActionButton
            androidWidth={
              isReadOnlyWallet ? maxButtonWidth : maxButtonWidth / 2
            }
            color={color}
            label=" 􀜖 Add"
            onPress={onAddToContact}
            size="big"
            textColor={colors.whiteLabel}
            weight="heavy"
          />
          {!isReadOnlyWallet && (
            <SheetActionButton
              androidWidth={maxButtonWidth / 2}
              color={color}
              label=" 􀈠 Send"
              onPress={onSend}
              size="big"
              textColor={colors.whiteLabel}
              weight="heavy"
            />
          )}
        </SheetActionButtonRow>
        {android && <ButtonSpacer />}
        <SheetActionButtonRow ignorePaddingBottom>
          <SheetActionButton
            androidWidth={maxButtonWidth}
            color={colors.blueGreyDark30}
            label="􀨭 Watch this Wallet"
            onPress={onWatchAddress}
            size="big"
            textColor={colors.whiteLabel}
            weight="heavy"
          />
        </SheetActionButtonRow>
      </Footer>
    </HeaderWrapper>
  );
}
