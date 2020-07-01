import React, { useEffect, useState } from 'react';
import { usePrevious, useTimeout } from '../../hooks';
import { magicMemo } from '../../utils';
import Toast from './Toast';

const CopyToast = ({ copiedText, copyCount }) => {
  const [isVisible, setIsVisible] = useState(false);
  const prevCopiedText = usePrevious(copiedText);
  const prevCopyCount = usePrevious(copyCount);
  const [startTimeout, stopTimeout] = useTimeout();

  useEffect(() => {
    if (
      (copiedText !== prevCopiedText || copyCount !== prevCopyCount) &&
      copiedText !== undefined
    ) {
      stopTimeout();
      setIsVisible(true);
      startTimeout(() => setIsVisible(false), 3000);
    }
  }, [
    copiedText,
    copyCount,
    isVisible,
    prevCopiedText,
    prevCopyCount,
    startTimeout,
    stopTimeout,
  ]);

  return (
    <Toast
      isVisible={isVisible}
      text={`􀉂 Copied "${copiedText}" to clipboard`}
    />
  );
};

export default magicMemo(CopyToast, ['copiedText', 'copyCount']);
