import * as lang from '@/languages';
import React, { useCallback, useState } from 'react';
import ProfileModal from './profile/ProfileModal';
import { analytics } from '@/analytics';
import { Navigation } from '@/navigation';

type NewWalletGroupStateProps = {
  onCloseModal: ({ name }: { name: string }) => void;
  numWalletGroups: number;
};

export default function NewWalletGroupState({ onCloseModal, numWalletGroups }: NewWalletGroupStateProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    analytics.track(analytics.event.addNewWalletGroupName, {
      name: value.trim(),
    });
    onCloseModal({
      name: value,
    });
    Navigation.goBack();
  }, [onCloseModal, value]);

  return (
    <ProfileModal
      handleCancel={Navigation.goBack}
      handleSubmit={handleSubmit}
      inputValue={value}
      onChange={setValue}
      placeholder={lang.t(lang.l.wallet.action.create_wallet_group_placeholder, {
        numWalletGroups: numWalletGroups + 1,
      })}
      submitButtonText={lang.t(lang.l.wallet.action.create_wallet_group)}
    />
  );
}
