import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';

export const RnbwMembershipScreen = memo(function RnbwMembershipScreen() {
  const tabBarOffset = useTabBarOffset();
  const { top } = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <Navbar floating title="Membership" leftComponent={<AccountImage />} />
      <ScrollView
        contentContainerStyle={{ paddingTop: top + 48, paddingBottom: tabBarOffset, paddingHorizontal: 20 }}
        style={styles.flex}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
