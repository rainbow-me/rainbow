import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ChartExpandedState,
  CustomGasState,
  LiquidityPoolExpandedState,
  SwapDetailsState,
  TokenIndexExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { isUnknownOpenSeaENS } from '@rainbow-me/handlers/ens';
import { useAsset, useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';

const ScreenTypes = {
  custom_gas: CustomGasState,
  swap_details: SwapDetailsState,
  token: ChartExpandedState,
  token_index: TokenIndexExpandedState,
  unique_token: UniqueTokenExpandedState,
  uniswap: LiquidityPoolExpandedState,
};

const Container = styled(Centered).attrs({
  alignItems: 'flex-end',
  bottom: 0,
  direction: 'column',
  flex: 1,
  justifyContent: 'flex-end',
})(({ deviceHeight, height }) => ({
  ...(height && {
    height: height + deviceHeight,
  }),
  ...position.coverAsObject,
}));

export default function ExpandedAssetSheet(props) {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const { isDarkMode } = useTheme();

  // We want to revalidate (ie. refresh OpenSea metadata) collectibles
  // to ensure the user can get the latest metadata of their collectible.
  const selectedAsset = useAsset(params.asset, {
    revalidateCollectibleInBackground: isUnknownOpenSeaENS(params?.asset),
  });

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
        ...params,
        ...props,
        asset: {
          ...params.asset,
          ...selectedAsset,
        },
      })}
    </Container>
  );
}
