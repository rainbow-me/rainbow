import React, { useMemo } from 'react';
import { Image } from 'react-native';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import { AccentColorProvider, Box, Columns, Inline, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { RewardsAmount } from '@/graphql/__generated__/metadata';
import { formatTokenDisplayValue } from '@/screens/rewards/helpers/formatTokenDisplayValue';
import { addDays, differenceInDays, differenceInHours, fromUnixTime, isPast } from 'date-fns';
import { useInfoIconColor } from '@/screens/rewards/hooks/useInfoIconColor';
import { useNavigation } from '@/navigation';
import { ButtonPressAnimation } from '@/components/animations';
import Routes from '@/navigation/routesNames';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { analyticsV2 } from '@/analytics';

type Props = {
  assetPrice?: number;
  tokenImageUrl: string;
  tokenSymbol: string;
  totalEarnings: RewardsAmount;
  pendingEarningsToken: number;
  nextAirdropTimestamp: number;
  color: string;
};

const TOKEN_IMAGE_SIZE = 16;

export const RewardsEarnings: React.FC<Props> = ({
  assetPrice,
  color,
  tokenImageUrl,
  pendingEarningsToken,
  tokenSymbol,
  totalEarnings,
  nextAirdropTimestamp,
}) => {
  const { navigate } = useNavigation();
  const infoIconColor = useInfoIconColor();
  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);

  const { formattedPendingEarnings, formattedTotalEarningsToken, formattedTotalEarningsNative, airdropTitle, airdropTime } = useMemo(() => {
    const formattedPendingEarnings = formatTokenDisplayValue(pendingEarningsToken, tokenSymbol);
    const formattedTotalEarningsToken = formatTokenDisplayValue(totalEarnings.token, tokenSymbol);
    const formattedTotalEarningsNative =
      assetPrice !== undefined
        ? convertAmountAndPriceToNativeDisplay(totalEarnings.token, assetPrice, assetPrice ? nativeCurrency : 'USD').display
        : convertAmountToNativeDisplay(totalEarnings.usd, 'USD');

    const today = new Date();
    const dayOfNextDistribution = fromUnixTime(nextAirdropTimestamp);
    const days = differenceInDays(dayOfNextDistribution, today);
    const hours = differenceInHours(dayOfNextDistribution, addDays(today, days));

    const airdropTitle = isPast(dayOfNextDistribution) ? i18n.t(i18n.l.rewards.last_airdrop) : i18n.t(i18n.l.rewards.next_airdrop);
    const airdropTime = `${Math.abs(days)}d ${Math.abs(hours)}h`;

    return {
      formattedPendingEarnings,
      formattedTotalEarningsNative,
      formattedTotalEarningsToken,
      airdropTitle,
      airdropTime,
    };
  }, [pendingEarningsToken, tokenSymbol, totalEarnings.token, totalEarnings.usd, nextAirdropTimestamp]);

  const navigateToTimingExplainer = () => {
    analyticsV2.track(analyticsV2.event.rewardsPressedPendingEarningsCard);
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'op_rewards_airdrop_timing',
    });
  };

  return (
    <AccentColorProvider color={color}>
      <Box paddingBottom="36px">
        <ButtonPressAnimation onPress={navigateToTimingExplainer} scaleTo={0.96} overflowMargin={50}>
          <RewardsSectionCard>
            <Columns space="32px">
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
                      width={{ custom: TOKEN_IMAGE_SIZE }}
                      height={{ custom: TOKEN_IMAGE_SIZE }}
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
                      width={{ custom: TOKEN_IMAGE_SIZE }}
                      height={{ custom: TOKEN_IMAGE_SIZE }}
                      borderRadius={8}
                      background="surfaceSecondaryElevated"
                      shadow="12px"
                    />
                    <Text color="labelSecondary" size="22pt" weight="bold">
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
                    <Text color={{ custom: infoIconColor }} size="13pt" weight="heavy">
                      􀅵
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
                  <Text color="labelSecondary" size="22pt" weight="bold">
                    {formattedTotalEarningsNative}
                  </Text>
                </Stack>
              </Stack>
            </Columns>
          </RewardsSectionCard>
        </ButtonPressAnimation>
      </Box>
    </AccentColorProvider>
  );
};
