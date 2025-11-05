import { RouteProp, useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { CustomGasState, ChartExpandedState, UniqueTokenExpandedState } from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';

const ScreenTypes = {
  custom_gas: CustomGasState,
  token: ChartExpandedState,
  unique_token: UniqueTokenExpandedState,
};

const Container = styled(Centered).attrs({
  alignItems: 'flex-end',
  bottom: 0,
  direction: 'column',
  flex: 1,
  justifyContent: 'flex-end',
})(({ deviceHeight, height }: { deviceHeight: number; height: number }) => ({
  ...(height && {
    height: height + deviceHeight,
  }),
  ...position.coverAsObject,
}));

export default function ExpandedAssetSheet(props: any) {
  const { height: deviceHeight } = useDimensions();
  const { goBack } = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.EXPANDED_ASSET_SHEET>>();

  return (
    <Container deviceHeight={deviceHeight} height={params.longFormHeight}>
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
