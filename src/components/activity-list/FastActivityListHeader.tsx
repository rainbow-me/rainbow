import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@rainbow-me/design-system';

const cx = StyleSheet.create({
  activityListHeader: {
    paddingHorizontal: 19,
  },
});

const ActivityListHeader = ({ title }: { title: string }) => (
  <View style={cx.activityListHeader}>
    <Text size="20px" weight="bold">
      {title}
    </Text>
  </View>
);

export default React.memo(ActivityListHeader);
