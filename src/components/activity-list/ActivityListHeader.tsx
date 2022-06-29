import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@rainbow-me/design-system';

const sx = StyleSheet.create({
  activityListHeader: {
    paddingHorizontal: 19,
  },
});

const ActivityListHeader = ({ title }: { title: string }) => (
  <View style={sx.activityListHeader}>
    <Text size="20px" weight="bold">
      {title}
    </Text>
  </View>
);

export default React.memo(ActivityListHeader);
