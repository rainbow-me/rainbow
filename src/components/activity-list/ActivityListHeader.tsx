import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system';

const sx = StyleSheet.create({
  activityListHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
});

const ActivityListHeader = ({ title }: { title: string }) => {
  return (
    <View style={sx.activityListHeader}>
      <Text numberOfLines={1} color="primary (Deprecated)" size="20px / 24px (Deprecated)" weight="bold">
        {title}
      </Text>
    </View>
  );
};

export default React.memo(ActivityListHeader);
