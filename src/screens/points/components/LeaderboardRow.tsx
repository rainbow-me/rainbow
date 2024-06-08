import * as i18n from '@/languages';
import React, { memo, useCallback, useMemo } from 'react';
import { Keyboard, Share } from 'react-native';
import { MenuActionConfig } from 'react-native-ios-context-menu';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { useClipboard, useContacts, useWallets, useWatchWallet } from '@/hooks';
import { useNavigation } from '@/navigation';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, isENSNFTRecord } from '@/utils';
import { address as formatAddress } from '@/utils/abbreviations';
import { Network } from '@/networks/types';
import { ContactAvatar, showDeleteContactActionSheet } from '@/components/contacts';
import { Bleed, Box, Inline, Stack, Text } from '@/design-system';
import MaskedView from '@react-native-masked-view/masked-view';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useTheme } from '@/theme';
import LinearGradient from 'react-native-linear-gradient';
import { ButtonPressAnimation } from '@/components/animations';
import { noop } from 'lodash';

const ACTIONS = {
  ADD_CONTACT: 'add-contact',
  COPY_ADDRESS: 'copy-address',
  ETHERSCAN: 'etherscan',
  OPEN_WALLET: 'open-wallet',
  REMOVE_CONTACT: 'remove-contact',
  SHARE: 'share',
};

export const LeaderboardRow = memo(function LeaderboardRow({
  address,
  ens,
  avatarURL,
  points,
  rank,
}: {
  address: string;
  ens?: string;
  avatarURL?: string;
  points: number;
  rank: number;
}) {
  const { switchToWalletWithAddress, selectedWallet } = useWallets();
  const { isWatching } = useWatchWallet({ address });
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const { contacts, onRemoveContact } = useContacts();
  const isSelectedWallet = useMemo(() => {
    const visibleWallet = selectedWallet.addresses.find((wallet: { visible: boolean }) => wallet.visible);
    ``;
    return visibleWallet.address.toLowerCase() === address?.toLowerCase();
  }, [selectedWallet.addresses, address]);

  const contact = address ? contacts[address.toLowerCase()] : undefined;

  const formattedAddress = useMemo(() => formatAddress(address, 4, 5), [address]);

  const menuItems = useMemo(() => {
    return [
      isWatching && {
        actionKey: ACTIONS.OPEN_WALLET,
        actionTitle: i18n.t(i18n.l.profiles.details.open_wallet),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'iphone.and.arrow.forward',
        },
      },
      {
        actionKey: ACTIONS.COPY_ADDRESS,
        actionTitle: i18n.t(i18n.l.profiles.details.copy_address),
        discoverabilityTitle: formattedAddress,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      },
      contact
        ? {
            actionKey: ACTIONS.REMOVE_CONTACT,
            actionTitle: i18n.t(i18n.l.profiles.details.remove_from_contacts),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.minus',
            },
          }
        : {
            actionKey: ACTIONS.ADD_CONTACT,
            actionTitle: i18n.t(i18n.l.profiles.details.add_to_contacts),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.plus',
            },
          },
      {
        actionKey: ACTIONS.ETHERSCAN,
        actionTitle: i18n.t(i18n.l.profiles.details.view_on_etherscan),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'link',
        },
      },
      {
        actionKey: ACTIONS.SHARE,
        actionTitle: i18n.t(i18n.l.profiles.details.share),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.and.arrow.up',
        },
      },
    ].filter(Boolean) as MenuActionConfig[];
  }, [isWatching, formattedAddress, contact]);

  const handlePressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    async ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ACTIONS.OPEN_WALLET) {
        if (!isSelectedWallet) {
          switchToWalletWithAddress(address);
        }
        navigate(Routes.WALLET_SCREEN);
      }
      if (actionKey === ACTIONS.COPY_ADDRESS) {
        setClipboard(address);
      }
      if (address && actionKey === ACTIONS.ETHERSCAN) {
        ethereumUtils.openAddressInBlockExplorer(address, Network.mainnet);
      }
      if (actionKey === ACTIONS.ADD_CONTACT) {
        navigate(Routes.MODAL_SCREEN, {
          address,
          contact,
          ens,
          nickname: ens,
          type: 'contact_profile',
        });
      }
      if (actionKey === ACTIONS.REMOVE_CONTACT) {
        showDeleteContactActionSheet({
          address,
          nickname: contact!.nickname,
          removeContact: onRemoveContact,
        });
        IS_ANDROID && Keyboard.dismiss();
      }
      if (actionKey === ACTIONS.SHARE) {
        const walletDisplay = ens || address;
        const shareLink = `${RAINBOW_PROFILES_BASE_URL}/${walletDisplay}`;
        Share.share(IS_ANDROID ? { message: shareLink } : { url: shareLink });
      }
    },
    [address, contact, ens, isSelectedWallet, navigate, onRemoveContact, setClipboard, switchToWalletWithAddress]
  );

  const menuConfig = useMemo(() => ({ menuItems, ...(IS_IOS && { menuTitle: '' }) }), [menuItems]);

  let gradient;
  let icon;
  switch (rank) {
    case 1:
      gradient = ['#FFE456', '#CF9500'];
      icon = '🥇';
      break;
    case 2:
      gradient = ['#FBFCFE', '#B3BCC7'];
      icon = '🥈';
      break;
    case 3:
      gradient = ['#DE8F38', '#AE5F25'];
      icon = '🥉';
      break;
    default:
      icon = `#${rank}`;
      break;
  }

  const formattedPoints = points.toLocaleString('en-US');

  return (
    <ContextMenuButton
      enableContextMenu
      menuConfig={menuConfig}
      {...(IS_ANDROID ? { handlePressMenuItem } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
    >
      <Box
        as={ButtonPressAnimation}
        onPress={noop}
        scaleTo={0.96}
        paddingVertical="10px"
        paddingHorizontal="16px"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Inline space="10px" alignVertical="center">
          {avatarURL && !isENSNFTRecord(avatarURL) ? (
            <ImageAvatar image={avatarURL} size="rewards" />
          ) : (
            <ContactAvatar
              color={colors.avatarBackgrounds[addressHashedColorIndex(address) ?? 0]}
              size="rewards"
              value={addressHashedEmoji(address)}
            />
          )}
          <Stack space="8px">
            <Box style={{ maxWidth: rank <= 3 ? 120 : 140 }}>
              <Text color="label" weight="bold" size="15pt" ellipsizeMode="middle" numberOfLines={1} containsEmoji>
                {ens || formattedAddress || ''}
              </Text>
            </Box>
          </Stack>
        </Inline>
        <Inline space="8px" alignVertical="center">
          {rank <= 3 && gradient ? (
            <Bleed vertical="10px">
              <MaskedView
                style={{ height: 30, alignItems: 'center' }}
                maskElement={
                  <Box paddingVertical="10px" justifyContent="center">
                    <Text align="right" weight="bold" color="label" size="15pt">
                      {formattedPoints}
                    </Text>
                  </Box>
                }
              >
                <LinearGradient style={{ width: 100, height: '100%' }} colors={gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
              </MaskedView>
            </Bleed>
          ) : (
            <Text align="right" weight="bold" color="labelTertiary" size="15pt">
              {formattedPoints}
            </Text>
          )}
          <Box width={{ custom: 32 }} alignItems="flex-end">
            <Text
              align="center"
              // eslint-disable-next-line no-nested-ternary
              size={rank >= 100 ? '11pt' : rank > 3 ? '13pt' : '15pt'}
              color="labelTertiary"
              weight={rank <= 3 ? 'semibold' : 'heavy'}
              containsEmoji={rank <= 3}
            >
              {icon}
            </Text>
          </Box>
        </Inline>
      </Box>
    </ContextMenuButton>
  );
});
