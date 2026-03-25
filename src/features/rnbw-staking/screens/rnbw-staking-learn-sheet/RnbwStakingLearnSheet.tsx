import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetHandleFixedToTop from '@/components/sheet/SheetHandleFixedToTop';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation/Navigation';

export const RnbwStakingLearnSheet = memo(function RnbwStakingLearnSheet() {
  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();
  const { replace } = useNavigation();

  const handlePressEnableStaking = useCallback(() => {
    replace(Routes.RNBW_STAKING_SCREEN);
  }, [replace]);

  return (
    <Box background="surfacePrimary" style={styles.container}>
      <SheetHandleFixedToTop top={safeAreaTop + 6} />
      <View style={[styles.content, { marginTop: safeAreaTop + 40, paddingBottom: safeAreaBottom + 8 }]}>
        <Box alignItems="center" gap={16}>
          <Text align="center" color="label" size="30pt" weight="heavy">
            {'Earn More Rewards With Staking'}
          </Text>
          <Text align="center" color="labelTertiary" size="17pt" weight="medium">
            {'Staking allows you to earn cashback rewards on your swaps.'}
          </Text>
        </Box>
        <Box gap={20} paddingVertical={'20px'}>
          <Text color="label" size="17pt" weight="bold">
            {'Reason 1'}
          </Text>
          <Text color="label" size="17pt" weight="bold">
            {'Reason 2'}
          </Text>
          <Text color="label" size="17pt" weight="bold">
            {'Reason 3'}
          </Text>
        </Box>
        <ButtonPressAnimation onPress={handlePressEnableStaking} style={styles.button}>
          <Box backgroundColor="yellow" borderRadius={24} width={'full'} height={48} justifyContent="center" alignItems="center">
            <Text color="label" size="22pt" weight="heavy">
              {'Enable Staking'}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </View>
    </Box>
  );
});

const styles = StyleSheet.create({
  button: {
    marginTop: 'auto',
    width: '100%',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
