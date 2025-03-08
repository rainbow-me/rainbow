import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { Box, Text } from '@/design-system';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

// ============ ⚠️ WIP ⚠️ ====================================================== //

export const ClaimAirdropSheet = () => {
  return (
    <View style={styles.container}>
      <Panel height={DEVICE_HEIGHT - safeAreaInsetValues.top - safeAreaInsetValues.bottom}>
        <ScrollView contentContainerStyle={styles.scrollContent} scrollIndicatorInsets={{ bottom: 44, top: 44 }} style={styles.scrollView}>
          <Box alignItems="center" gap={28} justifyContent="center">
            <Text align="center" color="label" containsEmoji size="20pt" weight="heavy">
              🎁 Claim Airdrop
            </Text>
          </Box>
        </ScrollView>
      </Panel>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
  },
  scrollContent: {
    paddingBottom: 44,
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 28,
  },
  separatorContainer: {
    marginTop: -16,
  },
});
