import React from 'react';
import { Image } from 'react-native';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import {
  AccentColorProvider,
  Box,
  Columns,
  Inline,
  Stack,
  Text,
} from '@/design-system';
import * as i18n from '@/languages';
import { RewardsAmount } from '@/graphql/__generated__/metadata';
import { formatTokenDisplayValue } from '@/screens/rewards/helpers/formatTokenDisplayValue';
import {
  addDays,
  differenceInDays,
  differenceInHours,
  fromUnixTime,
  isPast,
} from 'date-fns';
import { useInfoIconColor } from '@/screens/rewards/hooks/useInfoIconColor';

type Props = {
  tokenImageUrl: string;
  tokenSymbol: string;
  totalEarnings: RewardsAmount;
  pendingEarningsToken: number;
  nextAirdropTimestamp: number;
  color: string;
};

export const RewardsEarnings: React.FC<Props> = ({
  color,
  tokenImageUrl,
  pendingEarningsToken,
  tokenSymbol,
  totalEarnings,
  nextAirdropTimestamp,
}) => {
  const infoIconColor = useInfoIconColor();
  const formattedPendingEarnings = formatTokenDisplayValue(
    pendingEarningsToken,
    tokenSymbol
  );
  const formattedTotalEarningsToken = formatTokenDisplayValue(
    totalEarnings.token,
    tokenSymbol
  );

  const formattedTotalEarningsNative = totalEarnings.usd.toLocaleString(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }
  );

  const today = new Date();
  const dayOfNextDistribution = fromUnixTime(nextAirdropTimestamp);
  const days = differenceInDays(dayOfNextDistribution, today);
  const hours = differenceInHours(dayOfNextDistribution, addDays(today, days));

  const airdropTitle = isPast(dayOfNextDistribution)
    ? i18n.t(i18n.l.rewards.last_airdrop)
    : i18n.t(i18n.l.rewards.next_airdrop);
  const airdropTime = `${Math.abs(days)}d ${Math.abs(hours)}h`;

  return (
    <AccentColorProvider color={color}>
      <Box paddingBottom="12px">
        <RewardsSectionCard>
          <Columns>
            <Stack space="32px" alignHorizontal="left">
              <Stack space="12px">
                <Text color="labelSecondary" size="15pt" weight="semibold">
                  {i18n.t(i18n.l.rewards.pending_earnings)}
                </Text>
                <Inline space="6px" alignVertical="center">
                  <Box
                    as={Image}
                    source={{
                      uri: tokenImageUrl,
                    }}
                    width={{ custom: 16 }}
                    height={{ custom: 16 }}
                    borderRadius={8}
                    background="surfaceSecondaryElevated"
                    shadow="12px"
                  />
                  <Text color="label" size="22pt" weight="heavy">
                    {formattedPendingEarnings}
                  </Text>
                </Inline>
              </Stack>
              <Stack space="12px">
                <Text color="labelSecondary" size="15pt" weight="semibold">
                  {i18n.t(i18n.l.rewards.total_earnings)}
                </Text>
                <Inline space="6px" alignVertical="center">
                  <Box
                    as={Image}
                    source={{
                      uri: tokenImageUrl,
                    }}
                    width={{ custom: 16 }}
                    height={{ custom: 16 }}
                    borderRadius={8}
                    background="surfaceSecondaryElevated"
                    shadow="12px"
                  />
                  <Text color="labelSecondary" size="22pt" weight="heavy">
                    {formattedTotalEarningsToken}
                  </Text>
                </Inline>
              </Stack>
            </Stack>
            <Stack space="32px" alignHorizontal="right">
              <Stack space="12px" alignHorizontal="right">
                <Inline space="4px" alignVertical="center">
                  <Text color="labelSecondary" size="15pt" weight="semibold">
                    {airdropTitle}
                  </Text>
                  <Text
                    color={{ custom: infoIconColor }}
                    size="13pt"
                    weight="heavy"
                  >
                    {'􀅵'}
                  </Text>
                </Inline>
                <Inline space="6px" alignVertical="center">
                  <Text color="label" size="17pt" weight="semibold">
                    􀧞
                  </Text>
                  <Text color="label" size="22pt" weight="semibold">
                    {airdropTime}
                  </Text>
                </Inline>
              </Stack>
              <Stack space="12px" alignHorizontal="right">
                <Text color="labelSecondary" size="15pt" weight="semibold">
                  {i18n.t(i18n.l.rewards.current_value)}
                </Text>
                <Text color="labelSecondary" size="22pt" weight="heavy">
                  {formattedTotalEarningsNative}
                </Text>
              </Stack>
            </Stack>
          </Columns>
        </RewardsSectionCard>
      </Box>
    </AccentColorProvider>
  );
};
