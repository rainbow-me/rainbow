import React, { useEffect } from 'react';
import Toast from './Toast';
import { useBooleanState, usePrevious } from '@rainbow-me/hooks';
import { magicMemo } from '@rainbow-me/utils';

const CopyToast = ({ copiedText, copyCount }) => {
  const [isVisible, showToast] = useBooleanState(false, 3000);
  const prevCopiedText = usePrevious(copiedText);
  const prevCopyCount = usePrevious(copyCount);

  useEffect(() => {
    if (
      (copiedText !== prevCopiedText || copyCount !== prevCopyCount) &&
      copiedText !== undefined
    ) {
      showToast();
    }
  }, [
    copiedText,
    copyCount,
    isVisible,
    prevCopiedText,
    prevCopyCount,
    showToast,
  ]);

  return <Toast isVisible={isVisible} text={`􀁣 Copied "${copiedText}"`} />;
};

export default magicMemo(CopyToast, ['copiedText', 'copyCount']);
