import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { View, ViewProps } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { ThemeContextProps, withThemeContext } from '../../theme/ThemeContext';
import { deviceUtils } from '../../utils';
import { ShimmerAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row';
import { Row } from '../layout';
import styled from '@/styled-thing';
import { position } from '@/styles';

export const AssetListItemSkeletonHeight = CoinRowHeight;

type FakeItemProps = {
  color?: string;
  theme: ThemeContextProps;
};

// @ts-expect-error Property 'View' does not exist on type...
export const FakeAvatar = styled.View({
  ...position.sizeAsObject(40),
  backgroundColor: ({ theme: { colors }, color }: FakeItemProps) => color ?? colors.skeleton,
  borderRadius: 20,
});

export const FakeRow = styled(Row).attrs({
  align: 'flex-end',
  flex: 0,
  height: 10,
  justify: 'space-between',
  paddingBottom: 5,
  paddingTop: 5,
})({});

export const FakeText = styled(View).attrs(({ height = 10, width }: { height: number; width: number }) => ({
  height,
  width,
}))({
  backgroundColor: ({ theme: { colors }, color }: FakeItemProps) => color ?? colors.skeleton,
  borderRadius: ({ height }: { height: number }) => height / 2,
  height: ({ height }: { height: number }) => height,
  width: ({ width }: { width: number }) => width,
});

const Wrapper = styled(View)({
  ...position.sizeAsObject('100%'),
});

const ShimmerWrapper = styled(Wrapper)({
  backgroundColor: ({ theme: { colors }, color }: FakeItemProps) => color ?? colors.skeleton,
});

function Skeleton({
  animated = true,
  children,
  style,
  colors,
  shimmerColor,
  skeletonColor,
  width = deviceUtils.dimensions.width,
}: {
  animated?: boolean;
  children: React.ReactElement;
  style?: ViewProps['style'];
  colors: ThemeContextProps['colors'];
  shimmerColor?: string;
  skeletonColor?: string;
  width?: number;
}) {
  if (animated && IS_TESTING !== 'true') {
    return (
      <MaskedView maskElement={<Wrapper style={style}>{children}</Wrapper>} style={{ flex: 1 }}>
        <ShimmerWrapper color={skeletonColor}>
          <ShimmerAnimation color={shimmerColor ?? colors.shimmer} enabled gradientColor={shimmerColor ?? colors.shimmer} width={width} />
        </ShimmerWrapper>
      </MaskedView>
    );
  }
  return (
    <View
      style={[
        {
          flex: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default withThemeContext(Skeleton);
