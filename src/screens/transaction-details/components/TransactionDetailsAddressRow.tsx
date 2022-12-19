import React, { useEffect, useMemo, useState } from 'react';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '@/utils/profileUtils';
import { useENSAvatar } from '@/hooks';
import { isENSAddressFormat } from '@/helpers/validators';
import { fetchReverseRecord } from '@/handlers/ens';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import { Box, Column, Columns, Cover, Stack, Text } from '@/design-system';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTiming } from 'react-native-redash';
import { ButtonPressAnimation } from '@/components/animations';
import Clipboard from '@react-native-community/clipboard';
import { haptics } from '@/utils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { Contact } from '@/redux/contacts';
import { RainbowAccount } from '@/model/wallet';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@/helpers/emojiHandler';

type Props = {
  address: string;
  title: string;
  onAddressCopied?: () => void;
  contact?: Contact;
  account?: RainbowAccount;
};

export const TransactionDetailsAddressRow: React.FC<Props> = ({
  address,
  title,
  onAddressCopied,
  contact,
  account,
}) => {
  const formattedAddress = formatAddressForDisplay(address, 4, 16);
  const [fetchedEnsName, setFetchedEnsName] = useState<string | undefined>();
  const [fetchedEnsImage, setFetchedEnsImage] = useState<string | undefined>();
  const [imageLoaded, setImageLoaded] = useState(!!account?.image);
  const ensNameSharedValue = useTiming(!!fetchedEnsName, {
    duration: 420,
    easing: Easing.linear,
  });

  const accountEmoji = useMemo(() => returnStringFirstEmoji(account?.label), [
    account,
  ]);
  const accountName = useMemo(
    () => removeFirstEmojiFromString(account?.label),
    []
  );
  const color =
    account?.color ?? contact?.color ?? addressHashedColorIndex(address);
  const emoji = accountEmoji || addressHashedEmoji(address);
  const name =
    accountName || contact?.ens || fetchedEnsName || formattedAddress;

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
    if (!account?.image && (name || contact?.ens)) {
      const ens = name ?? contact?.ens;
      if (ens) {
        fetchENSAvatar(ens, { cacheFirst: true }).then(avatar => {
          if (avatar?.imageUrl) {
            setFetchedEnsImage(avatar.imageUrl);
          }
        });
      }
    }
  }, [name]);

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

  const onRowPress = () => {
    onAddressCopied?.();
    haptics.notificationSuccess();
    Clipboard.setString(address);
  };

  const onImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <ButtonPressAnimation onPress={onRowPress} scaleTo={0.96}>
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
            <Text
              color="labelTertiary"
              size="13pt"
              numberOfLines={1}
              weight="semibold"
            >
              {title}
            </Text>
            <Box>
              <Animated.View style={addressAnimatedStyle}>
                <Text
                  color="label"
                  size="17pt"
                  weight="semibold"
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {name}
                </Text>
              </Animated.View>
              <Cover>
                <Animated.View style={ensNameAnimatedStyle}>
                  <Text
                    color="label"
                    size="17pt"
                    weight="semibold"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {fetchedEnsName}
                  </Text>
                </Animated.View>
              </Cover>
            </Box>
          </Stack>
        </Columns>
      </Box>
    </ButtonPressAnimation>
  );
};
