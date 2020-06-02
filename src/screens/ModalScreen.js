import React, { createElement } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { useNavigationState } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  AddContactState,
  SupportedCountriesExpandedState,
  SwapDetailsState,
  WalletProfileCreator,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useNavigation } from '../navigation/Navigation';
import { padding, position } from '../styles';

const ModalTypes = {
  contact: AddContactState,
  supported_countries: SupportedCountriesExpandedState,
  swap_details: SwapDetailsState,
  wallet_profile_creator: WalletProfileCreator,
};

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${({ insets }) => padding(insets.top || 0, 15, 0)};
  ${position.size('100%')};
`;

export default function ModalScreen(props) {
  const insets = useSafeArea();
  const { goBack } = useNavigation();
  const { params } = useNavigationState();

  return (
    <Container insets={insets}>
      <TouchableBackdrop onPress={goBack} />
      {createElement(ModalTypes[params.type], {
        ...params,
        ...props,
      })}
    </Container>
  );
}
