import React, { useEffect } from 'react';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { withThemeContext } from '../../theme/ThemeContext';
import { CoinRowHeight } from '../coin-row';
import { ColumnWithMargins, RowWithMargins } from '../layout';
import Skeleton, { FakeAvatar, FakeRow, FakeText } from '../skeleton/Skeleton';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

export const AssetListItemSkeletonHeight = CoinRowHeight;

const Container = styled.View({
  height: AssetListItemSkeletonHeight,
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

function AssetListItemSkeleton({
  animated = true,
  index = 0,
  descendingOpacity,
  ignorePaddingHorizontal,
  colors,
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      return;
    }
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1250,
        easing: Easing.linear,
      }),
      -1
    );
  }, [animated, progress]);

  return (
    <Container descendingOpacity={descendingOpacity} index={index}>
      <Skeleton animated={animated}>
        <Wrapper
          ignorePaddingHorizontal={ignorePaddingHorizontal}
          index={index}
        >
          <FakeAvatar />
          <ColumnWithMargins
            backgroundColor={colors.transparent}
            flex={1}
            margin={10}
          >
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
