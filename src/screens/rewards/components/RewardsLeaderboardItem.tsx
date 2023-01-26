import React from 'react';
import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { RANK_SYMBOLS } from '@/screens/rewards/constants';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '@/utils/profileUtils';
import { ContactAvatar } from '@/components/contacts';

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
  const formattedAmountEarned = amountEarnedInToken.toLocaleString('en-US', {
    minimumFractionDigits: 2,
  });
  const color = !avatarUrl ? addressHashedColorIndex(address) : undefined;
  const emoji = !avatarUrl ? addressHashedEmoji(address) : undefined;

  const formattedBonusEarned = bonusEarnedInToken.toLocaleString('en-US');
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
            <Text size="13pt" color="labelTertiary" weight="bold">
              {`+${formattedBonusEarned} ${tokenSymbol}`}
            </Text>
            <Box
              paddingLeft={rank <= 50 ? '8px' : '12px'}
              paddingRight={rank > 50 ? '4px' : undefined}
            >
              <Text
                color="labelTertiary"
                size={rank <= 50 ? '20pt' : '13pt'}
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
