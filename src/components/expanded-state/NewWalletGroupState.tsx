import * as lang from '@/languages';
import React, { useCallback, useState } from 'react';
import ProfileModal from './profile/ProfileModal';
import { analyticsV2 as analytics } from '@/analytics';
import { useNavigation } from '@/navigation';

type NewWalletGroupStateProps = {
  onCancel: () => void;
  onCloseModal: ({ name }: { name: string }) => void;
  numWalletGroups: number;
};

export default function NewWalletGroupState({ onCancel, onCloseModal, numWalletGroups }: NewWalletGroupStateProps) {
  const { goBack } = useNavigation();

  const [value, setValue] = useState('');

  const handleCancel = useCallback(() => {
    onCancel?.();
    goBack();
  }, [goBack, onCancel]);

  const handleSubmit = useCallback(async () => {
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
      handleCancel={handleCancel}
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
