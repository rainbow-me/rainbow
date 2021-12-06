import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/TouchableBackdrop' was resol... Remove this comment to see the full error message
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ContactProfileState,
  SupportedCountriesExpandedState,
  WalletProfileState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

const ModalTypes = {
  contact_profile: ContactProfileState,
  supported_countries: SupportedCountriesExpandedState,
  wallet_profile: WalletProfileState,
};

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${({ insets }) => padding(insets.top || 0, 15, 0)};
  ${position.size('100%')};
`;

export default function ModalScreen(props: any) {
  const insets = useSafeArea();
  const { goBack } = useNavigation();
  const { params } = useRoute();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container insets={insets}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TouchableBackdrop onPress={goBack} />
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an
      'any' type because expre... Remove this comment to see the full error
      message
      {createElement(ModalTypes[params.type], {
        ...params,
        ...props,
      })}
    </Container>
  );
}
