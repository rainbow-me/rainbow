import React from 'react';
import { View, type ViewProps } from 'react-native';

import { CoinRowHeight } from '@/components/coin-row';
import { ColumnWithMargins, RowWithMargins } from '@/components/layout';
import Skeleton, { FakeAvatar, FakeRow, FakeText } from '@/components/skeleton/Skeleton';
import styled from '@/framework/ui/styled-thing';
import { colors, padding } from '@/styles';
import { withThemeContext, type ThemeContextProps } from '@/theme/ThemeContext';

export const AssetListItemSkeletonHeight = CoinRowHeight;

const Container = styled(View)({
  height: AssetListItemSkeletonHeight,
  opacity: ({ descendingOpacity, index }: { descendingOpacity: boolean; index: number }) => 1 - 0.2 * (descendingOpacity ? index : 0),
  width: '100%',
});

const Wrapper = styled(RowWithMargins).attrs({
  align: 'flex-end',
  justify: 'space-between',
  margin: 10,
})(({ ignorePaddingHorizontal }: { ignorePaddingHorizontal: boolean }) => ({
  ...padding.object(9, ignorePaddingHorizontal ? 0 : 19, 10, ignorePaddingHorizontal ? 0 : 19),
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) => colors.transparent,
}));

type AssetListItemSkeletonProps = {
  animated?: boolean;
  index?: number;
  descendingOpacity?: boolean;
  ignorePaddingHorizontal?: boolean;
} & Omit<ViewProps, 'children'>;

function AssetListItemSkeleton({
  animated = true,
  index = 0,
  descendingOpacity = false,
  ignorePaddingHorizontal,
  ...viewProps
}: AssetListItemSkeletonProps) {
  return (
    <Container descendingOpacity={descendingOpacity} index={index} {...viewProps}>
      <Skeleton animated={animated}>
        <Wrapper ignorePaddingHorizontal={ignorePaddingHorizontal} index={index}>
          <FakeAvatar />
          <ColumnWithMargins backgroundColor={colors.transparent} flex={1} margin={10}>
            <FakeRow>
              <FakeText width={100} />
              <FakeText width={80} />
            </FakeRow>
            <FakeRow>
              <FakeText width={60} />
              <FakeText width={50} />
            </FakeRow>
          </ColumnWithMargins>
        </Wrapper>
      </Skeleton>
    </Container>
  );
}

export default withThemeContext(AssetListItemSkeleton);
