import React from 'react';
import { Box, Text, useForegroundColor } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { colors } from '@/styles';

const DEFAULT_SIZE = 36;

function AddressImageAvatar({ url, size = DEFAULT_SIZE }: { url: string; size?: number }) {
  return <ImgixImage size={size} source={{ uri: url }} style={{ borderRadius: size / 2, height: size, width: size }} />;
}

function AddressEmojiAvatar({
  address,
  color,
  label,
  size = DEFAULT_SIZE,
}: {
  address: string;
  color: string | number;
  label: string;
  size?: number;
}) {
  const fillTertiary = useForegroundColor('fillTertiary');
  const emojiAvatar = returnStringFirstEmoji(label);
  const accountSymbol = returnStringFirstEmoji(emojiAvatar || addressHashedEmoji(address)) || '';

  const backgroundColor =
    typeof color === 'number'
      ? // sometimes the color is gonna be missing so we fallback to white
        // otherwise there will be only shadows without the the placeholder "circle"
        colors.avatarBackgrounds[color] ?? fillTertiary
      : color;

  return (
    <Box
      alignItems="center"
      borderRadius={size / 2}
      height={{ custom: size }}
      justifyContent="center"
      style={{ backgroundColor }}
      width={{ custom: size }}
    >
      <Text align="center" color="label" containsEmoji size={size > 50 ? '44pt' : 'icon 18px'} weight="heavy">
        {accountSymbol}
      </Text>
    </Box>
  );
}

export const AddressAvatar = React.memo(function AddressAvatar({
  address,
  color,
  label,
  size = DEFAULT_SIZE,
  url,
}: {
  address: string;
  color: string | number;
  label: string;
  size?: number;
  url?: string | null;
}) {
  return url ? (
    <AddressImageAvatar url={url} size={size} />
  ) : (
    <AddressEmojiAvatar address={address} color={color} label={label} size={size} />
  );
});
