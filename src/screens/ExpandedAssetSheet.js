import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ChartExpandedState,
  CustomGasState,
  SwapDetailsState,
  SwapSettingsState,
  TokenIndexExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';

const ScreenTypes = {
  custom_gas: CustomGasState,
  swap_details: SwapDetailsState,
  swap_settings: SwapSettingsState,
  token: ChartExpandedState,
  token_index: TokenIndexExpandedState,
  unique_token: UniqueTokenExpandedState,
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
  const insets = useSafeAreaInsets();
  const { goBack } = useNavigation();
  const { params } = useRoute();

  return (
    <Container deviceHeight={deviceHeight} height={params.longFormHeight} insets={insets}>
      {ios && <TouchableBackdrop onPress={goBack} />}

      {createElement(ScreenTypes[params.type], {
        ...params,
        ...props,
        asset: {
          ...params?.asset,
        },
      })}
    </Container>
  );
}
