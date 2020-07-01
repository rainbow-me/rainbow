import { useNavigation, useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ChartExpandedState,
  InvestmentExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useAsset } from '../hooks';
import { position } from '../styles';

const ScreenTypes = {
  token: ChartExpandedState,
  unique_token: UniqueTokenExpandedState,
  uniswap: InvestmentExpandedState,
};

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  top: ${({ insets }) => insets.top + 10};
  ${({ height }) => (height ? `height: ${height + 300}` : null)};
`;

export default function ExpandedAssetSheet(props) {
  const insets = useSafeArea();
  const { goBack } = useNavigation();
  const { params } = useRoute();

  const selectedAsset = useAsset(params.asset);

  return (
    <Container insets={insets} height={params.longFormHeight}>
      <StatusBar barStyle="light-content" />
      <TouchableBackdrop onPress={goBack} />
      {createElement(ScreenTypes[params.type], {
        asset: selectedAsset,
        ...props,
      })}
    </Container>
  );
}
