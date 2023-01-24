import React, { useCallback, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { BackgroundProvider, Box } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMockData } from '@/screens/rewards/mocks/getMockData';
import { RewardsResponseType } from '@/screens/rewards/types/RewardsResponseType';
import { RewardsContent } from '@/screens/rewards/components/RewardsContent';
import { RewardsFakeContent } from '@/screens/rewards/components/RewardsFakeContent';
import { IS_ANDROID } from '@/env';
import { StatusBar } from 'react-native';

export const RewardsSheet: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const [rewardsData, setRewardsData] = useState<RewardsResponseType | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMockData().then(data => {
        setRewardsData(data);
        setLoading(false);
      });
    }, [])
  );

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
            {loading || rewardsData === null ? (
              <RewardsFakeContent />
            ) : (
              <RewardsContent data={rewardsData} />
            )}
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
