// UnlockToast.tsx
import React from 'react';
import Toast from './Toast';
import { magicMemo } from '@/utils';

const UnlockToast = () => {
  const isVisible = true;

  return <Toast isVisible={isVisible} icon="close" text="Icon not unlocked" testID="icon-not-unlocked-toast" />;
};

export default magicMemo(UnlockToast, []);
