import { useRoute } from '@react-navigation/native';
import React, { createElement } from 'react';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  ContactProfileState,
  WalletProfileState,
} from '../components/expanded-state';
import { useNavigation } from '@/navigation';
import { ModalBottomSheet } from '@/navigation/bottom-sheet-navigator/components/ModalBottomSheet';

const ModalTypes = {
  contact_profile: ContactProfileState,
  wallet_profile: WalletProfileState,
};

export default function ModalScreen(props) {
  const { goBack } = useNavigation();
  const { params } = useRoute();

  return (
    <ModalBottomSheet>
      {createElement(ModalTypes[params.type], {
        ...params,
        ...props,
      })}
    </ModalBottomSheet>
  );
}
