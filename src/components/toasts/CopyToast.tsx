import React, { useEffect } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Toast' was resolved to '/Users/nickbytes... Remove this comment to see the full error message
import Toast from './Toast';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useBooleanState, usePrevious } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const CopyToast = ({ copiedText, copyCount }: any) => {
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

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Toast isVisible={isVisible} text={`􀁣 Copied "${copiedText}"`} />;
};

export default magicMemo(CopyToast, ['copiedText', 'copyCount']);
