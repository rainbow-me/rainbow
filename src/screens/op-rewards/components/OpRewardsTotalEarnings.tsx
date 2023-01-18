import React from 'react';
import { Image } from 'react-native';
import { OpRewardsSectionCard } from '@/screens/op-rewards/components/OpRewardsSectionCard';
import { Box, Columns, Inline, Rows, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import { OpRewardsProgressBar } from '@/screens/op-rewards/components/OpRewardsProgressBar';

export const OpRewardsTotalEarnings: React.FC = () => {
  const { colors } = useTheme();

  return (
    <OpRewardsSectionCard>
      <Rows space="16px">
        <Columns>
          <Stack space="12px" alignHorizontal="left">
            {/* TODO: Use Translations */}
            <Text color="labelTertiary" size="15pt" weight="semibold">
              Total Earnings
            </Text>
            <Text color="label" size="26pt" weight="heavy">
              $229.25
            </Text>
          </Stack>
          <Stack space="12px" alignHorizontal="right">
            <Text color="labelTertiary" size="15pt" weight="semibold">
              Multiplier
            </Text>
            <Text
              size="26pt"
              color={{ custom: colors.networkColors.optimism }}
              weight="bold"
            >
              2x
            </Text>
          </Stack>
        </Columns>
        <OpRewardsProgressBar />
        <Inline space="6px" alignVertical="center">
          <Box
            as={Image}
            source={{
              uri:
                'https://rainbowme-res.cloudinary.com/image/upload/v1668486694/assets/optimism/0x4200000000000000000000000000000000000042.png',
            }}
            width={{ custom: 16 }}
            height={{ custom: 16 }}
            // TODO: Add shadows
          />
          <Text
            color={{ custom: colors.networkColors.optimism }}
            size="15pt"
            weight="semibold"
          >
            <Text
              color={{ custom: colors.networkColors.optimism }}
              size="15pt"
              weight="semibold"
            >
              {"You've earned "}
            </Text>
            <Text
              color={{ custom: colors.networkColors.optimism }}
              size="15pt"
              weight="heavy"
            >
              201.502 OP
            </Text>
          </Text>
        </Inline>
      </Rows>
    </OpRewardsSectionCard>
  );
};
