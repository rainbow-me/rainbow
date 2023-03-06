import { useRoute } from '@react-navigation/native';
import React from 'react';
import AlreadyBackedUpView from './AlreadyBackedUpView';
import NeedsBackupView from './NeedsBackupView';

export default function SettingsBackupView() {
  const { params } = useRoute();
  if ((params as any)?.type === 'AlreadyBackedUpView') {
    return <AlreadyBackedUpView />;
  } else {
    return <NeedsBackupView />;
  }
}
