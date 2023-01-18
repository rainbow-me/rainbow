import React, { useCallback, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { BackgroundProvider, Box } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMockOpData } from '@/screens/op-rewards/mocks/getMockOpData';
import { OpRewardsResponseType } from '@/screens/op-rewards/types/OpRewardsResponseType';
import { OpRewardsContent } from '@/screens/op-rewards/components/OpRewardsContent';
import { OpRewardsFakeContent } from '@/screens/op-rewards/components/OpRewardsFakeContent';

export const OpRewardsSheet: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const [rewardsData, setRewardsData] = useState<OpRewardsResponseType | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMockOpData().then(data => {
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
          scrollEnabled={!loading && rewardsData}
        >
          <Box padding="20px">
            {loading || rewardsData === null ? (
              <OpRewardsFakeContent />
            ) : (
              <OpRewardsContent data={rewardsData} loading={loading} />
            )}
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
