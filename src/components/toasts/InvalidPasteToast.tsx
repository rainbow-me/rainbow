import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Toast' was resolved to '/Users/nickbytes... Remove this comment to see the full error message
import Toast from './Toast';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useInvalidPaste } from '@rainbow-me/hooks';

export default function InvalidPasteToast(props: any) {
  const { isInvalidPaste } = useInvalidPaste();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Toast
      isVisible={isInvalidPaste}
      text="􀉾 You can't paste that here"
      {...props}
    />
  );
}
