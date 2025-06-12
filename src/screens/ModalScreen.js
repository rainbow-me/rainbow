import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { ContactProfileState, WalletProfileState, NewWalletGroupState } from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import { DevTestBackupState } from '@/components/expanded-state/DevTestBackupState';

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
