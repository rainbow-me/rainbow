import React, { useMemo } from 'react';
import { Box, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { RewardsStatsCard } from './RewardsStatsCard';
import {
  RewardStatsAction,
  RewardStatsActionType,
} from '@/graphql/__generated__/metadata';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
} from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

type Props = {
  assetPrice?: number;
  actions: RewardStatsAction[];
  color: string;
};

export const RewardsStats: React.FC<Props> = ({
  assetPrice,
  actions,
  color,
}) => {
  const nativeCurrency = useSelector(
    (state: AppState) => state.settings.nativeCurrency
  );

  const swapsData = useMemo(() => {
    return actions.find(action => action.type === RewardStatsActionType.Swap);
  }, [actions]);

  const bridgeData = useMemo(() => {
    return actions.find(action => action.type === RewardStatsActionType.Bridge);
  }, [actions]);

  const getSwapsValue = useMemo(() => {
    if (assetPrice) {
      return convertAmountAndPriceToNativeDisplay(
        swapsData?.amount?.token || '0',
        assetPrice,
        nativeCurrency
      ).display;
    }

    return convertAmountToNativeDisplay(swapsData?.amount?.usd || '0', 'USD');
  }, [swapsData, assetPrice, nativeCurrency]);

  const getBridgeValue = useMemo(() => {
    if (assetPrice) {
      return convertAmountAndPriceToNativeDisplay(
        bridgeData?.amount?.token ?? '0',
        assetPrice,
        nativeCurrency
      ).display;
    }

    return convertAmountToNativeDisplay(bridgeData?.amount?.usd || '0', 'USD');
  }, [bridgeData, assetPrice, nativeCurrency]);

  return (
    <Box width="full" paddingBottom="12px">
      <Stack space="16px">
        <Text size="20pt" color="label" weight="heavy">
          {i18n.t(i18n.l.rewards.my_stats)}
        </Text>

        <Box
          alignItems="flex-start"
          flexDirection="row"
          justifyContent="flex-start"
          flexGrow={1}
          style={{ gap: 12 }}
        >
          <Box flexGrow={1}>
            <RewardsStatsCard
              key={RewardStatsActionType.Swap}
              title={i18n.t(i18n.l.rewards.swapped)}
              value={getSwapsValue}
              secondaryValue={`${
                swapsData?.rewardPercent?.toString() ?? '0'
              }% reward`}
              secondaryValueColor={{ custom: color }}
              secondaryValueIcon={'􀐚'}
            />
          </Box>

          <Box flexGrow={1}>
            <RewardsStatsCard
              key={RewardStatsActionType.Bridge}
              title={i18n.t(i18n.l.rewards.bridged)}
              value={getBridgeValue}
              secondaryValue={`${
                bridgeData?.rewardPercent?.toString() ?? '0'
              }% reward`}
              secondaryValueColor={{ custom: color }}
              secondaryValueIcon={'􀐚'}
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};
