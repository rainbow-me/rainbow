import React, { useCallback, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { Box } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMockOpData } from '@/screens/op-rewards/mocks/getMockOpData';
import { OpRewardsResponseType } from '@/screens/op-rewards/types/OpRewardsResponseType';
import { OpRewardsTitle } from '@/screens/op-rewards/components/OpRewardsTitle';

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
    // @ts-ignore
    <SlackSheet height="100%" contentHeight={height - top} scrollEnabled>
      <Box flexGrow={1} padding="20px">
        <OpRewardsTitle
          text={rewardsData?.meta.title ?? ''}
          loading={loading}
        />
      </Box>
    </SlackSheet>
  );
};
