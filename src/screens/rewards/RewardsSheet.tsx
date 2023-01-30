import React from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { BackgroundProvider, Box } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RewardsContent } from '@/screens/rewards/components/RewardsContent';
import { RewardsFakeContent } from '@/screens/rewards/components/RewardsFakeContent';
import { IS_ANDROID } from '@/env';
import { StatusBar } from 'react-native';
import { useRewards } from '@/resources/rewards/rewardsQuery';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

export const RewardsSheet: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const accountAddress = useSelector(
    (state: AppState) => state.settings.accountAddress
  );
  const { data, isLoading } = useRewards({
    address: accountAddress,
  });
  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        // @ts-expect-error JS component
        <SlackSheet
          backgroundColor={backgroundColor}
          height="100%"
          contentHeight={height - top}
          additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
          scrollEnabled
        >
          <Box padding="20px">
            {isLoading || data === undefined || !data.rewards ? (
              <RewardsFakeContent />
            ) : (
              <RewardsContent data={data.rewards} />
            )}
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
