import * as i18n from '@/languages';
import React, { useCallback, useState } from 'react';
import ProfileModal from './profile/ProfileModal';
import { analytics } from '@/analytics';
import { useNavigation } from '@/navigation';

type NewWalletGroupStateProps = {
  onCloseModal: ({ name }: { name: string }) => void;
  numWalletGroups: number;
};

export default function NewWalletGroupState({ onCloseModal, numWalletGroups }: NewWalletGroupStateProps) {
  const { goBack } = useNavigation();

  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    analytics.track(analytics.event.addNewWalletGroupName, {
      name: value.trim(),
    });
    onCloseModal({
      name: value,
    });
    goBack();
  }, [goBack, onCloseModal, value]);

  return (
    <ProfileModal
      handleCancel={goBack}
      handleSubmit={handleSubmit}
      inputValue={value}
      onChange={setValue}
      placeholder={i18n.t(i18n.l.wallet.action.create_wallet_group_placeholder, {
        numWalletGroups: numWalletGroups + 1,
      })}
      submitButtonText={i18n.t(i18n.l.wallet.action.create_wallet_group)}
    />
  );
}
