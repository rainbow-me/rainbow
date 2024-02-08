import React, { useMemo } from 'react';
import { Box, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { RewardsStatsCard } from './RewardsStatsCard';
import { RewardStatsAction, RewardStatsActionType } from '@/graphql/__generated__/metadata';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { analyticsV2 } from '@/analytics';

type Props = {
  assetPrice?: number;
  actions: RewardStatsAction[];
  color: string;
};

export const RewardsStats: React.FC<Props> = ({ assetPrice, actions, color }) => {
  const { navigate } = useNavigation();
  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);

  const swapsData = actions.find(action => action.type === RewardStatsActionType.Swap);

  const bridgeData = actions.find(action => action.type === RewardStatsActionType.Bridge);

  const getPressHandlerForType = (type: RewardStatsActionType) => {
    switch (type) {
      case RewardStatsActionType.Bridge:
        return () => {
          analyticsV2.track(analyticsV2.event.rewardsPressedBridgedCard);
          navigate(Routes.EXPLAIN_SHEET, {
            type: 'op_rewards_bridge',
            percent: bridgeData?.rewardPercent || 0,
          });
        };
      case RewardStatsActionType.Swap:
        return () => {
          analyticsV2.track(analyticsV2.event.rewardsPressedSwappedCard);
          navigate(Routes.EXPLAIN_SHEET, {
            type: 'op_rewards_swap',
            percent: swapsData?.rewardPercent || 0,
          });
        };
      default:
        return () => {};
    }
  };

  const getSwapsValue = useMemo(() => {
    if (assetPrice) {
      return convertAmountAndPriceToNativeDisplay(swapsData?.amount?.token || '0', assetPrice, nativeCurrency).display;
    }

    return convertAmountToNativeDisplay(swapsData?.amount?.usd || '0', 'USD');
  }, [assetPrice, nativeCurrency, swapsData?.amount?.token, swapsData?.amount?.usd]);

  const getBridgeValue = useMemo(() => {
    if (assetPrice) {
      return convertAmountAndPriceToNativeDisplay(bridgeData?.amount?.token ?? '0', assetPrice, nativeCurrency).display;
    }

    return convertAmountToNativeDisplay(bridgeData?.amount?.usd || '0', 'USD');
  }, [assetPrice, nativeCurrency, bridgeData?.amount?.token, bridgeData?.amount?.usd]);

  return (
    <Box width="full" paddingBottom="12px">
      <Stack space="16px">
        <Text size="20pt" color="label" weight="heavy">
          {i18n.t(i18n.l.rewards.my_stats)}
        </Text>

        <Box alignItems="flex-start" flexDirection="row" justifyContent="flex-start" flexGrow={1} style={{ gap: 12 }}>
          <Box flexGrow={1}>
            <RewardsStatsCard
              key={RewardStatsActionType.Swap}
              title={i18n.t(i18n.l.rewards.swapped)}
              value={getSwapsValue}
              secondaryValue={`${swapsData?.rewardPercent?.toString() ?? '0'}% reward`}
              secondaryValueColor={{ custom: color }}
              secondaryValueIcon={'􀐚'}
              onPress={getPressHandlerForType(RewardStatsActionType.Swap)}
            />
          </Box>

          <Box flexGrow={1}>
            <RewardsStatsCard
              key={RewardStatsActionType.Bridge}
              title={i18n.t(i18n.l.rewards.bridged)}
              value={getBridgeValue}
              secondaryValue={`${bridgeData?.rewardPercent?.toString() ?? '0'}% reward`}
              secondaryValueColor={{ custom: color }}
              secondaryValueIcon={'􀐚'}
              onPress={getPressHandlerForType(RewardStatsActionType.Bridge)}
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};
