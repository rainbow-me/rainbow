import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import { fetchReverseRecord } from '@/handlers/ens';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import { Box, Column, Columns, Cover, Stack, Text } from '@/design-system';
import Animated, { Easing, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useTiming } from 'react-native-redash';
import { ButtonPressAnimation } from '@/components/animations';
import Clipboard from '@react-native-clipboard/clipboard';
import { haptics } from '@/utils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { Contact } from '@/redux/contacts';
import { RainbowAccount } from '@/model/wallet';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Navigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { IS_ANDROID, IS_IOS } from '@/env';
import { isENSAddressFormat } from '@/helpers/validators';
import * as i18n from '@/languages';
import ContextMenu from '@/components/context-menu/ContextMenu.android';

type ContextMenuRendererProps = {
  children: React.ReactNode;
  name: string | undefined;
  color: number | null;
  formattedAddress: string | undefined;
  fetchedEnsName: string | undefined;
} & Omit<Props, 'title'>;

const ContextMenuRenderer = ({
  children,
  account,
  address,
  contact,
  name,
  color,
  formattedAddress,
  fetchedEnsName,
  onAddressCopied,
}: ContextMenuRendererProps) => {
  const menuConfig = useMemo(
    () => ({
      menuTitle: '',
      menuItems: [
        {
          actionKey: 'send',
          actionTitle: i18n.t(i18n.l.transaction_details.context_menu.send),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'paperplane',
          },
        },
        ...(!account
          ? [
              {
                actionKey: 'contact',
                actionTitle: contact
                  ? i18n.t(i18n.l.transaction_details.context_menu.edit_contact)
                  : i18n.t(i18n.l.transaction_details.context_menu.add_contact),
                icon: {
                  iconType: 'SYSTEM',
                  iconValue: contact ? 'person.crop.circle' : 'person.crop.circle.badge.plus',
                },
              },
            ]
          : []),
        {
          actionKey: 'copy',
          actionTitle: i18n.t(i18n.l.transaction_details.context_menu.copy_address),
          actionSubtitle: isENSAddressFormat(name) ? name : formattedAddress,
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'square.on.square',
          },
        },
      ],
    }),
    [contact, account, formattedAddress, name]
  );

  const onPressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    e => {
      const actionKey = e.nativeEvent.actionKey;
      if (actionKey !== 'copy') {
        haptics.selection();
      }
      switch (actionKey) {
        case 'copy':
          onAddressCopied?.();
          haptics.notificationSuccess();
          Clipboard.setString(address);
          return;
        case 'contact':
          Navigation.handleAction(Routes.MODAL_SCREEN, {
            address: address,
            color: color,
            contact,
            ens: fetchedEnsName || contact?.ens,
            type: 'contact_profile',
          });
          return;
        case 'send':
          if (IS_IOS) {
            Navigation.handleAction(Routes.SEND_FLOW, {
              params: {
                address,
              },
              screen: Routes.SEND_SHEET,
            });
          } else {
            Navigation.handleAction(Routes.SEND_FLOW, {
              address,
            });
          }

          return;
      }
    },
    [address, fetchedEnsName, contact, color, onAddressCopied]
  );

  const onPressActionSheetItem = useCallback(
    (buttonIndex: number) => {
      switch (buttonIndex) {
        case 0:
          Navigation.handleAction(Routes.SEND_FLOW, {
            params: {
              address,
            },
            screen: Routes.SEND_SHEET,
          });
          return;
        case 1:
          Navigation.handleAction(Routes.MODAL_SCREEN, {
            address: address,
            color: color,
            contact,
            ens: fetchedEnsName || contact?.ens,
            type: 'contact_profile',
          });
          return;
        case 2:
          onAddressCopied?.();
          haptics.notificationSuccess();
          Clipboard.setString(address);
          return;
      }
    },
    [address, color, contact, fetchedEnsName, onAddressCopied]
  );

  if (IS_ANDROID) {
    return (
      <ContextMenu
        activeOpacity={0}
        cancelButtonIndex={menuConfig.menuItems.length - 1}
        dynamicOptions={undefined}
        onPressActionSheet={onPressActionSheetItem}
        options={menuConfig.menuItems.map(i => i.actionTitle)}
      >
        <View>{children}</View>
      </ContextMenu>
    );
  }

  return (
    <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem} menuAlignmentOverride="left">
      {children}
    </ContextMenuButton>
  );
};

type Props = {
  address: string;
  title: string;
  onAddressCopied?: () => void;
  contact?: Contact;
  account?: RainbowAccount;
};

export const TransactionDetailsAddressRow: React.FC<Props> = ({ address, title, onAddressCopied, contact, account }) => {
  const formattedAddress = formatAddressForDisplay(address);
  const [fetchedEnsName, setFetchedEnsName] = useState<string | undefined>();
  const [fetchedEnsImage, setFetchedEnsImage] = useState<string | undefined>();
  const [imageLoaded, setImageLoaded] = useState(!!account?.image);
  const ensNameSharedValue = useTiming(!!fetchedEnsName, {
    duration: 420,
    easing: Easing.linear,
  });

  const accountEmoji = useMemo(() => returnStringFirstEmoji(account?.label), [account]);
  const accountName = useMemo(() => removeFirstEmojiFromString(account?.label), []);
  const color = account?.color ?? contact?.color ?? addressHashedColorIndex(address);
  const emoji = accountEmoji || addressHashedEmoji(address);
  const name = accountName || contact?.nickname || contact?.ens || formattedAddress;

  const imageUrl = fetchedEnsImage ?? account?.image;
  const ensAvatarSharedValue = useTiming(!!imageUrl && imageLoaded, {
    duration: account?.image ? 0 : 420,
  });

  useEffect(() => {
    if (!contact?.nickname && !accountName) {
      fetchReverseRecord(address).then(name => {
        if (name) {
          setFetchedEnsName(name);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!account?.image && (fetchedEnsName || contact?.ens)) {
      const ens = fetchedEnsName ?? contact?.ens;
      if (ens) {
        fetchENSAvatar(ens, { cacheFirst: true }).then(avatar => {
          if (avatar?.imageUrl) {
            setFetchedEnsImage(avatar.imageUrl);
          }
        });
      }
    }
  }, [fetchedEnsName]);

  const addressAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ensNameSharedValue.value, [0, 0.5, 1], [1, 0, 0]),
  }));
  const ensNameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ensNameSharedValue.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  const emojiAvatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ensAvatarSharedValue.value, [0, 1], [1, 0]),
  }));
  const ensAvatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ensAvatarSharedValue.value,
  }));

  const onImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <ContextMenuRenderer
      address={address}
      onAddressCopied={onAddressCopied}
      contact={contact}
      account={account}
      name={name}
      color={color}
      formattedAddress={formattedAddress}
      fetchedEnsName={fetchedEnsName}
    >
      <ButtonPressAnimation scaleTo={0.96}>
        <Box paddingVertical="10px">
          <Columns space="10px" alignVertical="center">
            <Column width="content">
              <Box>
                <Animated.View style={ensAvatarAnimatedStyle}>
                  <ImageAvatar
                    image={imageUrl}
                    size="medium"
                    // @ts-expect-error JS component
                    onLoad={onImageLoad}
                  />
                </Animated.View>
                <Cover>
                  <Animated.View style={emojiAvatarAnimatedStyle}>
                    <ContactAvatar color={color} size="medium" value={emoji} />
                  </Animated.View>
                </Cover>
              </Box>
            </Column>
            <Stack space="10px">
              <Text color="labelTertiary" size="13pt" numberOfLines={1} weight="semibold">
                {title}
              </Text>
              <Box>
                <Animated.View style={addressAnimatedStyle}>
                  <Text color="label" size="17pt" weight="semibold" numberOfLines={1}>
                    {name}
                  </Text>
                </Animated.View>
                <Cover>
                  <Animated.View style={ensNameAnimatedStyle}>
                    <Text color="label" size="17pt" weight="semibold" numberOfLines={1}>
                      {fetchedEnsName}
                    </Text>
                  </Animated.View>
                </Cover>
              </Box>
            </Stack>
          </Columns>
        </Box>
      </ButtonPressAnimation>
    </ContextMenuRenderer>
  );
};
