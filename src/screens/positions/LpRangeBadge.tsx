import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';

const ASSET_SPACE = 2;
const WIDTH = 32;
const OUTTER_BORDER_RADIUS = 4;
const INNER_BORDER_RADIUS = 2;
const MIN_ALLOCATION_PERCENTAGE = 0.25;
const MAX_ALLOCATION_PERCENTAGE = 0.75;

type LpRangeBadgeProps = {
  assets: {
    id: string;
    color: string;
    allocationPercentage: number;
  }[];
};

export const LpRangeBadge = ({ assets }: LpRangeBadgeProps) => {
  return (
    <Box flexDirection="row" width={{ custom: 32 }} height={{ custom: 10 }} gap={ASSET_SPACE}>
      {assets.map((asset, index) => {
        const isFirst = index === 0;
        const isLast = index === assets.length - 1;
        const isMiddle = !isFirst && !isLast;

        let borderTopLeftRadius = isFirst ? OUTTER_BORDER_RADIUS : INNER_BORDER_RADIUS;
        let borderBottomLeftRadius = isFirst ? OUTTER_BORDER_RADIUS : INNER_BORDER_RADIUS;
        let borderTopRightRadius = isLast ? OUTTER_BORDER_RADIUS : INNER_BORDER_RADIUS;
        let borderBottomRightRadius = isLast ? OUTTER_BORDER_RADIUS : INNER_BORDER_RADIUS;

        let width = Math.max(
          Math.min(asset.allocationPercentage * WIDTH, MAX_ALLOCATION_PERCENTAGE * WIDTH),
          MIN_ALLOCATION_PERCENTAGE * WIDTH
        );

        if (asset.allocationPercentage === 0) {
          width = 0;
          borderTopLeftRadius = OUTTER_BORDER_RADIUS;
          borderBottomLeftRadius = OUTTER_BORDER_RADIUS;
          borderTopRightRadius = OUTTER_BORDER_RADIUS;
          borderBottomRightRadius = OUTTER_BORDER_RADIUS;
        }

        if (asset.allocationPercentage === 1) {
          width = WIDTH;
          borderTopLeftRadius = OUTTER_BORDER_RADIUS;
          borderBottomLeftRadius = OUTTER_BORDER_RADIUS;
          borderTopRightRadius = OUTTER_BORDER_RADIUS;
          borderBottomRightRadius = OUTTER_BORDER_RADIUS;
        }

        return (
          <Box
            key={asset.id}
            borderTopLeftRadius={borderTopLeftRadius}
            borderBottomLeftRadius={borderBottomLeftRadius}
            borderTopRightRadius={borderTopRightRadius}
            borderBottomRightRadius={borderBottomRightRadius}
            backgroundColor={asset.color}
            height={'full'}
            width={{ custom: width }}
            shadowColor={asset.color}
            shadowOpacity={IS_IOS ? 0.2 : 1}
            shadowRadius={9}
            elevation={3}
            style={{
              shadowOffset: { width: 0, height: 3 },
              borderCurve: 'continuous',
            }}
          >
            <Box
              height={'full'}
              borderTopLeftRadius={borderTopLeftRadius}
              borderBottomLeftRadius={borderBottomLeftRadius}
              borderTopRightRadius={borderTopRightRadius}
              borderBottomRightRadius={borderBottomRightRadius}
              style={{
                overflow: 'hidden',
                borderCurve: 'continuous',
              }}
            >
              <LinearGradient
                colors={
                  isMiddle
                    ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.0)', 'rgba(255, 255, 255, 0.1)']
                    : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)']
                }
                start={{ x: isFirst ? 0 : 1, y: 0.5 }}
                end={{ x: isFirst ? 1 : 0, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
