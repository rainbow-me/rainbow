import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/TouchableBackdrop' was resol... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/context' or its co... Remove this comment to see the full error message
import { useTheme } from '@rainbow-me/context';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAsset, useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

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
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

export default function ExpandedAssetSheet(props: any) {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const { isDarkMode } = useTheme();
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const selectedAsset = useAsset(params.asset);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      deviceHeight={deviceHeight}
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      height={params.longFormHeight}
      insets={insets}
    >
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && !isDarkMode && !params.fromDiscover && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <StatusBar barStyle="light-content" />
      )}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <TouchableBackdrop onPress={goBack} />}
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an
      'any' type because expre... Remove this comment to see the full error
      message
      {createElement(ScreenTypes[params.type], {
        asset: selectedAsset,
        ...params,
        ...props,
      })}
    </Container>
  );
}
