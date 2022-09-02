import lang from 'i18n-js';
import React, { createContext, useCallback, useContext } from 'react';
import { ColumnWithMargins } from '../layout';
import AvatarCircle from '../profile/AvatarCircle';
import SheetHandle from '../sheet/SheetHandle';
import {
  SheetActionButton,
  SheetActionButtonRow,
} from '../sheet/sheet-action-buttons';
import { Text, TruncatedAddress } from '../text';
import { getContacts } from '@/handlers/localstorage/contacts';
import { isHexString } from '@/handlers/web3';
import isNativeStackAvailable from '@/helpers/isNativeStackAvailable';
import { useImportingWallet, useRainbowProfile, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { abbreviations } from '@/utils';

export const ShowcaseContext = createContext();

const HeaderWrapper = styled.View({
  alignItems: 'center',
  height: ({ height }) => height,
  justifyContent: 'center',
  paddingTop: 40,
  width: '100%',
});

const Footer = styled(ColumnWithMargins).attrs({
  margin: 19,
})({
  ...padding.object(19, 0, 21),
  width: '100%',
});

const Spacer = styled.View({
  height: 19,
});

const ButtonSpacer = styled.View({
  height: 0,
});

const AddressText = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark,
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  lineHeight: 'loosest',
  opacity: 0.6,
  size: 'large',
  weight: 'heavy',
}))({
  width: '100%',
});

const ENSAddress = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.dark,
  lineHeight: 'loosest',
  size: 'larger',
  weight: 'heavy',
}))({
  width: '100%',
});

export function Header() {
  const { goBack, navigate } = useNavigation();
  const contextValue = useContext(ShowcaseContext);
  const { isReadOnlyWallet } = useWallets();
  const { rainbowProfile } = useRainbowProfile(contextValue?.address);

  const { colors } = useTheme();

  const emoji =
    contextValue?.data?.profile?.accountSymbol || rainbowProfile?.emoji;

  const color =
    contextValue?.data?.profile?.accountColor || rainbowProfile?.color;

  const onAddToContact = useCallback(async () => {
    const contacts = await getContacts();
    const currentContact = contacts[contextValue?.address];

    navigate(Routes.MODAL_SCREEN, {
      address: contextValue?.address,
      contactNickname: currentContact?.nickname,
      type: 'contact_profile',
    });
  }, [contextValue?.address, navigate]);

  const onSend = useCallback(async () => {
    goBack();
    if (isNativeStackAvailable || android) {
      navigate(Routes.SEND_FLOW, {
        params: {
          address: contextValue?.addressOrDomain || contextValue?.address,
        },
        screen: Routes.SEND_SHEET,
      });
    } else {
      navigate(Routes.SEND_FLOW, {
        address: contextValue?.addressOrDomain || contextValue?.address,
      });
    }
  }, [contextValue?.address, contextValue?.addressOrDomain, goBack, navigate]);

  const { handleSetSeedPhrase, handlePressImportButton } = useImportingWallet();

  const onWatchAddress = useCallback(() => {
    if (contextValue?.setIsSearchModeEnabled) {
      contextValue.setIsSearchModeEnabled(false);
    }
    handleSetSeedPhrase(contextValue.address);
    handlePressImportButton(contextValue.address);
  }, [contextValue, handleSetSeedPhrase, handlePressImportButton]);

  const mainText =
    contextValue?.data?.reverseEns ||
    contextValue?.addressOrDomain?.toLowerCase();

  const secondaryText =
    contextValue?.address?.toLowerCase() === mainText
      ? null
      : contextValue?.address?.toLowerCase();

  return (
    <HeaderWrapper height={350} testID="showcase-header-wrapper">
      <SheetHandle />
      <Spacer />
      <AvatarCircle
        color={color}
        emoji={emoji}
        image={null}
        onPress={() => {}}
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
            color={color}
            label={` 􀜖 ${lang.t('button.add')}`}
            onPress={onAddToContact}
            size="big"
            textColor={colors.whiteLabel}
            weight="heavy"
          />
          {!isReadOnlyWallet && (
            <SheetActionButton
              color={color}
              label={` 􀈠 ${lang.t('button.send')}`}
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
            color={colors.blueGreyDark30}
            label={`􀨭 ${lang.t('button.watch_this_wallet')}`}
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
