import React from 'react';
import { Image, StyleSheet } from 'react-native';

import visaBadge from '@/assets/visaBadge.png';
import visaBadgeLarge from '@/assets/visaBadgeLarge.png';
import { Box } from '@/design-system';

const SIZES = {
  small: { badge: { borderRadius: 7, height: 22, width: 32 }, image: { height: 7, width: 21 }, source: visaBadge },
  large: { badge: { borderRadius: 8, height: 26, width: 36 }, image: { height: 8, width: 25 }, source: visaBadgeLarge },
};

export function VisaBadge({ size = 'small' }: { size?: keyof typeof SIZES }) {
  const { badge, image, source } = SIZES[size];

  return (
    <Box alignItems="center" justifyContent="center" style={[styles.badge, badge]}>
      <Image source={source} style={image} />
    </Box>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#1B33C3',
  },
});
