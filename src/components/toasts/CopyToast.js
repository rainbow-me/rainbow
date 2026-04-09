import React, { useEffect } from 'react';

import useBooleanState from '@/hooks/useBooleanState';
import usePrevious from '@/hooks/usePrevious';
import * as i18n from '@/languages';
import magicMemo from '@/utils/magicMemo';

import Toast from './Toast';

const CopyToast = ({ copiedText, copyCount }) => {
  const [isVisible, showToast] = useBooleanState(false, 3000);
  const prevCopiedText = usePrevious(copiedText);
  const prevCopyCount = usePrevious(copyCount);

  useEffect(() => {
    if ((copiedText !== prevCopiedText || copyCount !== prevCopyCount) && copiedText !== undefined) {
      showToast();
    }
  }, [copiedText, copyCount, isVisible, prevCopiedText, prevCopyCount, showToast]);

  return <Toast isVisible={isVisible} text={`􀁣 ${i18n.t(i18n.l.toasts.copied, { copiedText })}`} />;
};

export default magicMemo(CopyToast, ['copiedText', 'copyCount']);
