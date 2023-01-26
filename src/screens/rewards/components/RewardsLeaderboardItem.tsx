import React from 'react';
import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { RANK_SYMBOLS } from '@/screens/rewards/constants';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '@/utils/profileUtils';
import { ContactAvatar } from '@/components/contacts';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { getGradientColorsForRank } from '@/screens/rewards/helpers/getGradientColorsForRank';
import { useTheme } from '@/theme';

const MaskedGradientText: React.FC<{
  text: string;
  gradientColors: string[];
}> = ({ text, gradientColors }) => {
  return (
    <Box>
      <MaskedView
        maskElement={
          <Box>
            <Text size="13pt" color="label" weight="bold">
              {text}
            </Text>
          </Box>
        }
      >
        <Box style={{ opacity: 0 }}>
          <Text size="13pt" color="label" weight="bold">
            {text}
          </Text>
        </Box>
        <LinearGradient
          colors={gradientColors}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </MaskedView>
    </Box>
  );
};

type Props = {
  rank: number;
  avatarUrl?: string;
  address: string;
  ens?: string;
  amountEarnedInToken: number;
  bonusEarnedInToken: number;
  tokenSymbol: string;
};

export const RewardsLeaderboardItem: React.FC<Props> = ({
  address,
  avatarUrl,
  ens,
  amountEarnedInToken,
  bonusEarnedInToken,
  tokenSymbol,
  rank,
}) => {
  const { isDarkMode } = useTheme();
  const formattedAmountEarned = amountEarnedInToken.toLocaleString('en-US', {
    minimumFractionDigits: 2,
  });
  const color = !avatarUrl ? addressHashedColorIndex(address) : undefined;
  const emoji = !avatarUrl ? addressHashedEmoji(address) : undefined;

  const formattedBonusEarned = bonusEarnedInToken.toLocaleString('en-US');
  const additionalRewardText = `+${formattedBonusEarned} ${tokenSymbol}`;
  return (
    <Stack>
      <Columns space="10px" alignVertical="center">
        <Column width="content">
          <Box>
            {avatarUrl ? (
              <ImageAvatar image={avatarUrl} size="rewards" />
            ) : (
              <ContactAvatar color={color} size="smedium" value={emoji} />
            )}
          </Box>
        </Column>
        <Stack space="8px">
          <Text color="label" size="15pt" weight="semibold">
            {ens ?? `${address.slice(0, 6)}...${address.slice(-4)}`}
          </Text>
          <Text size="13pt" color="labelTertiary" weight="semibold">
            {`${formattedAmountEarned} ${tokenSymbol}`}
          </Text>
        </Stack>
        <Column width="content">
          <Inline alignHorizontal="right" alignVertical="center">
            {rank < 4 && (
              <MaskedGradientText
                text={additionalRewardText}
                gradientColors={getGradientColorsForRank(rank, isDarkMode)}
              />
            )}
            {rank >= 4 && (
              <Text size="13pt" color="labelTertiary" weight="bold">
                {additionalRewardText}
              </Text>
            )}
            <Box paddingLeft="8px">
              <Text
                color="labelTertiary"
                size="20pt"
                weight={rank < 4 ? 'heavy' : 'semibold'}
                containsEmoji={rank < 4}
              >
                {RANK_SYMBOLS[rank.toString()] ?? rank}
              </Text>
            </Box>
          </Inline>
        </Column>
      </Columns>
    </Stack>
  );
};
