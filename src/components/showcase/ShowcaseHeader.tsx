import React, { createContext, useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../profile/AvatarCircle' was resolved to '... Remove this comment to see the full error message
import AvatarCircle from '../profile/AvatarCircle';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../sheet/SheetHandle' was resolved to '/Us... Remove this comment to see the full error message
import SheetHandle from '../sheet/SheetHandle';
import {
  SheetActionButton,
  SheetActionButtonRow,
} from '../sheet/sheet-action-buttons';
import { Text, TruncatedAddress } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/localstor... Remove this comment to see the full error message
import { getContacts } from '@rainbow-me/handlers/localstorage/contacts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { isHexString } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isNativeSt... Remove this comment to see the full error message
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useImportingWallet, useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { colors, padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { abbreviations, profileUtils } from '@rainbow-me/utils';

// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
export const ShowcaseContext = createContext();

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const HeaderWrapper = styled.View`
  width: 100%;
  padding-top: 40;
  justify-content: center;
  align-items: center;
  height: ${({ height }: any) => height};
`;

const Footer = styled(ColumnWithMargins).attrs({
  margin: 19,
})`
  ${padding(19, 0, 21)};
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: 19;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
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

const avatarColor = profileUtils.emojiColorIndexes.map(
  (idx: any) => colors.avatarBackgrounds[idx]
);

function hashCode(text: any) {
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
  const { goBack, navigate } = useNavigation();
  const contextValue = useContext(ShowcaseContext);
  const { isReadOnlyWallet } = useWallets();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  const hash = Math.abs(hashCode(contextValue?.address?.toLowerCase()) % 35);

  const emoji = useMemo(() => {
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    const emojiFromContext = contextValue?.data?.profile?.accountSymbol;
    if (emojiFromContext) {
      return emojiFromContext;
    }
    return profileUtils.popularEmojis[hash];
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  }, [contextValue?.data?.profile?.accountSymbol, hash]);

  const color = useMemo(() => {
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    const colorFromContext = contextValue?.data?.profile?.accountColor;
    if (colorFromContext) {
      return colorFromContext;
    }
    return avatarColor[hash];
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  }, [contextValue?.data?.profile?.accountColor, hash]);

  const onAddToContact = useCallback(async () => {
    const contacts = await getContacts();
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    const currentContact = contacts[contextValue?.address];
    const nickname =
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      contextValue?.data?.reverseEns ||
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      (isHexString(contextValue?.addressOrDomain)
        ? // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
          abbreviations.address(contextValue?.addressOrDomain, 4, 4)
        : // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
          contextValue?.addressOrDomain);
    navigate(Routes.MODAL_SCREEN, {
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      address: contextValue?.address,
      color: currentContact?.color || color,
      contact: currentContact || {
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        address: contextValue?.address,
        color: currentContact?.color || color,
        nickname: `${emoji} ${nickname}`,
        temporary: true,
      },
      type: 'contact_profile',
    });
  }, [
    color,
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue?.address,
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue?.addressOrDomain,
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue?.data?.reverseEns,
    emoji,
    navigate,
  ]);

  const onSend = useCallback(async () => {
    goBack();
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    if (isNativeStackAvailable || android) {
      navigate(Routes.SEND_FLOW, {
        params: {
          // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
          address: contextValue?.addressOrDomain || contextValue?.address,
        },
        screen: Routes.SEND_SHEET,
      });
    } else {
      navigate(Routes.SEND_FLOW, {
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        address: contextValue?.addressOrDomain || contextValue?.address,
      });
    }
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  }, [contextValue?.address, contextValue?.addressOrDomain, goBack, navigate]);

  const { handleSetSeedPhrase, handlePressImportButton } = useImportingWallet();

  const onWatchAddress = useCallback(() => {
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    handleSetSeedPhrase(contextValue.address);
    handlePressImportButton(
      color,
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      contextValue.address,
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      contextValue?.data?.profile?.accountSymbol
    );
  }, [
    color,
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue.address,
    handlePressImportButton,
    handleSetSeedPhrase,
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue?.data?.profile?.accountSymbol,
  ]);

  const mainText =
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue?.data?.reverseEns ||
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue?.addressOrDomain?.toLowerCase();

  const secondaryText =
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contextValue?.address?.toLowerCase() === mainText
      ? null
      : // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        contextValue?.address?.toLowerCase();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <HeaderWrapper height={350} testID="showcase-header-wrapper">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetHandle />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Spacer />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AvatarCircle
        image={null}
        isAvatarPickerAvailable={false}
        onPress={() => {}}
        showcaseAccountColor={color}
        showcaseAccountSymbol={emoji}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ENSAddress
        address={mainText}
        as={isHexString(mainText) && TruncatedAddress}
      >
        {mainText}
      </ENSAddress>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {secondaryText && <AddressText address={secondaryText} />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Footer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetActionButtonRow ignorePaddingBottom>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButton
            color={color}
            label=" 􀜖 Add"
            onPress={onAddToContact}
            size="big"
            textColor={colors.whiteLabel}
            weight="heavy"
          />
          {!isReadOnlyWallet && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <SheetActionButton
              color={color}
              label=" 􀈠 Send"
              onPress={onSend}
              size="big"
              textColor={colors.whiteLabel}
              weight="heavy"
            />
          )}
        </SheetActionButtonRow>
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {android && <ButtonSpacer />}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetActionButtonRow ignorePaddingBottom>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButton
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
