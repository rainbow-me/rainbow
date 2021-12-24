import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ContactProfileState,
  SupportedCountriesExpandedState,
  WalletProfileState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useNavigation } from '@rainbow-me/navigation';
import { padding, position } from '@rainbow-me/styles';
import styled from 'rainbowed-components';

const ModalTypes = {
  contact_profile: ContactProfileState,
  supported_countries: SupportedCountriesExpandedState,
  wallet_profile: WalletProfileState,
};

const Container = styled(Centered).attrs({ direction: 'column' })(
  ({ insets }) => ({
    ...position.sizeAsObject('100%'),
    ...padding.object(insets.top || 0, 15, 0),
  })
);

export default function ModalScreen(props) {
  const insets = useSafeArea();
  const { goBack } = useNavigation();
  const { params } = useRoute();

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
