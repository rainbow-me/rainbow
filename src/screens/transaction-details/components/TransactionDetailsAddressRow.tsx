import React, { useEffect, useState } from 'react';
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

type Props = {
  address: string;
  title: string;
  onAddressCopied?: () => void;
  contact?: Contact;
};

export const TransactionDetailsAddressRow: React.FC<Props> = ({
  address,
  title,
  onAddressCopied,
  contact,
}) => {
  const formattedAddress = formatAddressForDisplay(address, 4, 16);
  const [ensName, setEnsName] = useState<string | undefined>(contact?.ens);
  const ensNameSharedValue = useTiming(!!ensName, {
    duration: contact?.ens ? 0 : 420,
    easing: Easing.linear,
  });
  const color = contact?.color ?? addressHashedColorIndex(address);
  const emoji = addressHashedEmoji(address);

  const { data: avatar } = useENSAvatar(ensName ?? '', {
    enabled: isENSAddressFormat(ensName),
  });
  const imageUrl = avatar?.imageUrl;

  const ensAvatarSharedValue = useTiming(!!imageUrl, {
    duration: 420,
  });

  useEffect(() => {
    if (!contact)
      fetchReverseRecord(address).then(name => {
        if (name) {
          setEnsName(name);
        }
      });
  }, []);

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

  return (
    <ButtonPressAnimation
      onPress={onRowPress}
      scaleTo={0.96}
      hapticType="notificationSuccess"
      enableHapticFeedback
    >
      <Box paddingVertical="10px">
        <Columns space="10px" alignVertical="center">
          <Column width="content">
            <Box>
              <Animated.View style={ensAvatarAnimatedStyle}>
                <ImageAvatar image={imageUrl} size="medium" />
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
                  {contact?.nickname || formattedAddress}
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
                    {ensName}
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
