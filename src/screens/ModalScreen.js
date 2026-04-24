import React, { createElement } from 'react';

import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DevTestBackupState } from '@/components/expanded-state/DevTestBackupState';
import styled from '@/framework/ui/styled-thing';
import { useNavigation } from '@/navigation/Navigation';
import { padding, position } from '@/styles';

import { ContactProfileState, NewWalletGroupState, WalletProfileState } from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';

const ModalTypes = {
  contact_profile: ContactProfileState,
  wallet_profile: WalletProfileState,
  new_wallet_group: NewWalletGroupState,
  dev_test_backup: DevTestBackupState,
};

const Container = styled(Centered).attrs({ direction: 'column' })(({ insets }) => ({
  ...position.sizeAsObject('100%'),
  ...padding.object(insets.top || 0, 15, 0),
}));

export default function ModalScreen(props) {
  const insets = useSafeAreaInsets();
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
