import React from 'react';
import { Image } from 'react-native';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Columns,
  Inline,
  Stack,
  Text,
} from '@/design-system';
import { RewardsProgressBar } from '@/screens/rewards/components/RewardsProgressBar';
import * as i18n from '@/languages';

const TOTAL_SUPPLY = 2000;

type Props = {
  multiplier: number;
  tokenImageUrl: string;
  tokenSymbol: string;
  totalEarningsToken: number;
  totalEarningsUsd: number;
  color: string;
};

export const RewardsTotalEarnings: React.FC<Props> = ({
  color,
  multiplier,
  tokenImageUrl,
  tokenSymbol,
  totalEarningsToken,
  totalEarningsUsd,
}) => {
  return (
    <AccentColorProvider color={color}>
      <Box paddingBottom="12px">
        <RewardsSectionCard>
          <Stack space="16px">
            <Columns>
              <Stack space="12px" alignHorizontal="left">
                <Text color="labelTertiary" size="15pt" weight="semibold">
                  {i18n.t(i18n.l.rewards.total_earnings)}
                </Text>
                <Text color="label" size="26pt" weight="heavy">
                  {`$${totalEarningsUsd}`}
                </Text>
              </Stack>
              <Stack space="12px" alignHorizontal="right">
                <Text color="labelTertiary" size="15pt" weight="semibold">
                  {i18n.t(i18n.l.rewards.multiplier)}
                </Text>
                <Text size="26pt" color="accent" weight="bold">
                  {multiplier}x
                </Text>
              </Stack>
            </Columns>
            <RewardsProgressBar
              progress={Math.min(totalEarningsToken / TOTAL_SUPPLY, 1)}
              color={color}
            />
            <Inline space="6px" alignVertical="center">
              <Bleed vertical="3px">
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
              </Bleed>
              <Text color="accent" size="15pt" weight="semibold">
                <Text color="accent" size="15pt" weight="semibold">
                  {i18n.t(i18n.l.rewards.you_earned)}
                </Text>
                <Text color="accent" size="15pt" weight="heavy">
                  {`${totalEarningsToken} ${tokenSymbol}`}
                </Text>
              </Text>
            </Inline>
          </Stack>
        </RewardsSectionCard>
      </Box>
    </AccentColorProvider>
  );
};
