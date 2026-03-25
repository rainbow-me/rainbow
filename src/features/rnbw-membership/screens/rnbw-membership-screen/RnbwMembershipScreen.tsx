import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Box } from '@/design-system';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { RnbwRewardsClaimCard } from './components/RnbwRewardsClaimCard';
import { RnbwAirdropClaimCard } from './components/RnbwAirdropClaimCard';
import { RnbwStakingCard } from './components/RnbwStakingCard';

export const RnbwMembershipScreen = memo(function RnbwMembershipScreen() {
  return (
    <View style={styles.flex}>
      <Navbar hasStatusBarInset title="Membership" leftComponent={<AccountImage />} />
      <ScrollView contentContainerStyle={styles.scrollViewContentContainer} style={styles.flex}>
        <Box gap={16}>
          <RnbwStakingCard />
          <RnbwRewardsClaimCard />
          <RnbwAirdropClaimCard />
        </Box>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingHorizontal: 20,
  },
});
