import { useRoute } from '@react-navigation/core';
import React from 'react';
import AlreadyBackedUpView from './AlreadyBackedUpView';
import NeedsBackupView from './NeedsBackupView';

export default function SettingsBackupView() {
  const { params } = useRoute();
  if (params?.type === 'AlreadyBackedUpView') {
    return <AlreadyBackedUpView />;
  } else {
    return <NeedsBackupView />;
  }
}
