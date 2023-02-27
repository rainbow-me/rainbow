import React from 'react';
import { withThemeContext } from '../../theme/ThemeContext';
import { CoinRowHeight } from '../coin-row';
import { ColumnWithMargins, RowWithMargins } from '../layout';
import Skeleton, { FakeAvatar, FakeRow, FakeText } from '../skeleton/Skeleton';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { AssetListHeaderHeight } from './AssetListHeader';
import Divider from '../Divider';

export const AssetListSectionHeaderSkeletonHeight = AssetListHeaderHeight;

const Container = styled.View({
  height: AssetListSectionHeaderSkeletonHeight,
  opacity: ({ descendingOpacity, index }) =>
    1 - 0.2 * (descendingOpacity ? index : 0),
  width: '100%',
});

const Wrapper = styled(RowWithMargins).attrs({
  align: 'flex-end',
  justify: 'space-between',
  margin: 10,
})(({ ignorePaddingHorizontal }) => ({
  ...padding.object(
    9,
    ignorePaddingHorizontal ? 0 : 19,
    10,
    ignorePaddingHorizontal ? 0 : 19
  ),
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
}));

function AssetListSectionHeaderSkeleton({
  animated = true,
  index = 0,
  descendingOpacity,
  ignorePaddingHorizontal,
  colors,
  ...rest
}) {
  return (
    <Container descendingOpacity={descendingOpacity} index={index} {...rest}>
      <Skeleton animated={animated}>
        <Wrapper
          ignorePaddingHorizontal={ignorePaddingHorizontal}
          index={index}
        >
          <FakeRow>
            <FakeText width={145} height={30} />
          </FakeRow>
          <FakeRow>
            <FakeText width={100} height={30} />
          </FakeRow>
        </Wrapper>
        <Divider />
      </Skeleton>
    </Container>
  );
}

export default withThemeContext(AssetListSectionHeaderSkeleton);
