import { memo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { RnbwClaimCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/RnbwClaimCard';
import * as i18n from '@/languages';

export const RnbwMembershipScreen = memo(function RnbwMembershipScreen() {
  const handlePressClaimAirdrop = useCallback(() => {
    Navigation.handleAction(Routes.RNBW_AIRDROP_SCREEN);
  }, []);

  return (
    <View style={styles.flex}>
      <Navbar hasStatusBarInset title="Membership" leftComponent={<AccountImage />} />
      <ScrollView contentContainerStyle={styles.scrollViewContentContainer} style={styles.flex}>
        <RnbwClaimCard
          tokenAmount="100"
          nativeCurrencyAmount="$42.58"
          title={i18n.t(i18n.l.rnbw_membership.claim_card.airdrop)}
          onPressClaim={handlePressClaimAirdrop}
        />
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
