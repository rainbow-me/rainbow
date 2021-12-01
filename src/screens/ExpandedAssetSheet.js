import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ChartExpandedState,
  LiquidityPoolExpandedState,
  SwapDetailsState,
  TokenIndexExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useTheme } from '@rainbow-me/context';
import { useAsset, useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { position } from '@rainbow-me/styles';

const ScreenTypes = {
  swap_details: SwapDetailsState,
  token: ChartExpandedState,
  token_index: TokenIndexExpandedState,
  unique_token: UniqueTokenExpandedState,
  uniswap: LiquidityPoolExpandedState,
};

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

export default function ExpandedAssetSheet(props) {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const { isDarkMode } = useTheme();
  const selectedAsset = useAsset(params.asset);

  return (
    <Container
      deviceHeight={deviceHeight}
      height={params.longFormHeight}
      insets={insets}
    >
      {ios && !isDarkMode && !params.fromDiscover && (
        <StatusBar barStyle="light-content" />
      )}
      {ios && <TouchableBackdrop onPress={goBack} />}
      {createElement(ScreenTypes[params.type], {
        asset: selectedAsset,
        ...params,
        ...props,
      })}
    </Container>
  );
}
