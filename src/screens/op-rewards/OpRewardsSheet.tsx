import React, { useCallback, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { Box, Text } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMockOpData } from '@/screens/op-rewards/mocks/getMockOpData';

export const OpRewardsSheet: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const [rewardsData, setRewardsData] = useState<any>(null);
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
      <Box flexGrow={1}>
        <Text size="15pt" color="label">
          {loading ? 'Loading...' : JSON.stringify(rewardsData)}
        </Text>
      </Box>
    </SlackSheet>
  );
};
