import React from 'react';
import { withThemeContext } from '../../theme/ThemeContext';
import { CoinRowHeight } from '../coin-row';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import Skeleton, {
  FakeAvatar,
  FakeNFTFamilyAvatar,
  FakeRow,
  FakeText,
} from '../skeleton/Skeleton';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { TokenFamilyHeaderHeight } from '../token-family';
import FastImage from 'react-native-fast-image';
import { ImgixImage } from '../images';
import { random } from 'lodash';

export const AssetListNFTRowkeletonHeight = TokenFamilyHeaderHeight;

const Container = styled.View({
  height: AssetListNFTRowkeletonHeight,
  opacity: ({ descendingOpacity, index }) =>
    1 - 0.2 * (descendingOpacity ? index : 0),
  width: '100%',
});

const Wrapper = styled(RowWithMargins).attrs({
  align: 'flex-end',
  justify: 'space-between',
})(({ ignorePaddingHorizontal }) => ({
  ...padding.object(
    9,
    ignorePaddingHorizontal ? 0 : 19,
    10,
    ignorePaddingHorizontal ? 0 : 19
  ),
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
}));

function AssetListNFTRowSkeleton({
  animated = true,
  descendingOpacity,
  ignorePaddingHorizontal,
  colors,
  ...rest
}) {
  const index = random(0, 1);

  return (
    <Container descendingOpacity={descendingOpacity} index={index} {...rest}>
      <Skeleton animated={animated}>
        <Wrapper
          ignorePaddingHorizontal={ignorePaddingHorizontal}
          index={index}
        >
          <FakeRow>
            <RowWithMargins align="center" margin={10} width={145}>
              <FakeNFTFamilyAvatar />
              <FakeText width={index % 2 ? 80 : 120} height={20} />
            </RowWithMargins>
          </FakeRow>
          <FakeText width={40} height={30} />
        </Wrapper>
      </Skeleton>
    </Container>
  );
}

export default withThemeContext(AssetListNFTRowSkeleton);
