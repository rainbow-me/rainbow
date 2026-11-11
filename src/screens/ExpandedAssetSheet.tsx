import React, { createElement } from 'react';
import { Platform } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';

import styled from '@/framework/ui/styled-thing';
import useDimensions from '@/hooks/useDimensions';
import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { position } from '@/styles';

import { UniqueTokenExpandedState } from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';

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

export function ExpandedAssetSheet(props: any) {
  const { height: deviceHeight } = useDimensions();
  const { goBack } = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.EXPANDED_ASSET_SHEET>>();

  return (
    <Container deviceHeight={deviceHeight} height={params.longFormHeight}>
      {Platform.OS === 'ios' && <TouchableBackdrop onPress={goBack} />}

      {createElement(UniqueTokenExpandedState, {
        ...params,
        ...props,
        asset: {
          ...params?.asset,
        },
      })}
    </Container>
  );
}
