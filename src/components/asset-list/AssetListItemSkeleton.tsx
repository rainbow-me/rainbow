import React, { useMemo } from 'react';
import { withThemeContext } from '../../theme/ThemeContext';
import { CoinRowHeight } from '../coin-row';
import Skeleton, { FakeAvatar, FakeRow, FakeText } from '../skeleton/Skeleton';
import { colors } from '@/styles';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Box } from '@/design-system';

export const AssetListItemSkeletonHeight = CoinRowHeight;

const sx = StyleSheet.create({
  container: {
    height: AssetListItemSkeletonHeight,
    width: '100%',
  },
  wrapper: {
    backgroundColor: colors.transparent,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginRight: 10,
    paddingBottom: 10,
    paddingTop: 9,
  },
  column: {
    backgroundColor: colors.transparent,
    marginBottom: 10,
    flex: 1,
  },
});

type AssetListItemSkeletonProps = {
  animated?: boolean;
  index?: number;
  descendingOpacity?: boolean;
  ignorePaddingHorizontal?: boolean;
  colors?: any;
} & Omit<ViewProps, 'children'>;

function AssetListItemSkeleton({
  animated = true,
  index = 0,
  descendingOpacity = false,
  ignorePaddingHorizontal,
  colors,
  ...rest
}: AssetListItemSkeletonProps) {
  const opacity = useMemo(() => 1 - 0.2 * (descendingOpacity ? index : 0), [descendingOpacity, index]);

  return (
    <View style={[sx.container, { opacity }]} {...rest}>
      <Skeleton animated={animated}>
        <Box paddingHorizontal={{ custom: ignorePaddingHorizontal ? 0 : 19 }} style={sx.wrapper}>
          <FakeAvatar />
          <Box style={sx.column}>
            <FakeRow>
              <FakeText width={100} />
              <FakeText width={80} />
            </FakeRow>
            <FakeRow>
              <FakeText width={60} />
              <FakeText width={50} />
            </FakeRow>
          </Box>
        </Box>
      </Skeleton>
    </View>
  );
}

export default withThemeContext(AssetListItemSkeleton);
