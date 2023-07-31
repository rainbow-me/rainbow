import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system';
import { useTheme } from '@/theme';

const sx = StyleSheet.create({
  activityListHeader: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
});

const ActivityListHeader = ({ title }: { title: string }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        sx.activityListHeader,
        { backgroundColor: colors.surfacePrimary },
      ]}
    >
      <Text numberOfLines={1} color="label" size="20pt" weight="heavy">
        {title}
      </Text>
    </View>
  );
};

export default React.memo(ActivityListHeader);
