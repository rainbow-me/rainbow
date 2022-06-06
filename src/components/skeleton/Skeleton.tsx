import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { View, ViewProps } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { withThemeContext } from '../../theme/ThemeContext';
import { deviceUtils } from '../../utils';
import { ShimmerAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row';
import { Row } from '../layout';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

export const AssetListItemSkeletonHeight = CoinRowHeight;

// @ts-expect-error Property 'View' does not exist on type...
export const FakeAvatar = styled.View({
  ...position.sizeAsObject(40),
  backgroundColor: ({ theme: { colors } }: any) => colors.skeleton,
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

export const FakeText = styled(View).attrs(
  ({ height = 10, width }: { height: number; width: number }) => ({
    height,
    width,
  })
)({
  backgroundColor: ({ theme: { colors } }: any) => colors.skeleton,
  borderRadius: ({ height }: { height: number }) => height / 2,
  height: ({ height }: { height: number }) => height,
  width: ({ width }: { width: number }) => width,
});

const Wrapper = styled(View)({
  ...position.sizeAsObject('100%'),
});

const ShimmerWrapper = styled(Wrapper)({
  backgroundColor: ({ theme: { colors } }: any) => colors.skeleton,
});

function Skeleton({
  animated = true,
  children,
  style,
  colors,
  width = deviceUtils.dimensions.width,
}: {
  animated?: boolean;
  children: React.ReactElement;
  style?: ViewProps['style'];
  colors: any;
  width?: number;
}) {
  if (animated && IS_TESTING !== 'true') {
    return (
      <MaskedView
        maskElement={<Wrapper style={style}>{children}</Wrapper>}
        style={{ flex: 1 }}
      >
        <ShimmerWrapper>
          <ShimmerAnimation
            color={colors.shimmer}
            enabled
            gradientColor={colors.shimmer}
            width={width}
          />
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
