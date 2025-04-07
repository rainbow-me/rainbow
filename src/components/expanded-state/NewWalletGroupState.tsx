import * as lang from '@/languages';
import React, { useCallback, useState } from 'react';
import ProfileModal from './profile/ProfileModal';
import { analytics, analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';
import { useNavigation } from '@/navigation';

type NewWalletGroupStateProps = {
  onCloseModal: ({ name }: { name: string }) => void;
  numWalletGroups: number;
};

export default function NewWalletGroupState({ onCloseModal, numWalletGroups }: NewWalletGroupStateProps) {
  const { goBack } = useNavigation();

  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    analyticsV2.track(event.addNewWalletGroupName, {
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
      placeholder={lang.t(lang.l.wallet.action.create_wallet_group_placeholder, {
        numWalletGroups,
      })}
      submitButtonText={lang.t(lang.l.wallet.action.create_wallet_group)}
    />
  );
}
