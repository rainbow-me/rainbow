import React from 'react';

import useInvalidPaste from '@/hooks/useInvalidPaste';
import * as i18n from '@/languages';

import Toast from './Toast';

export default function InvalidPasteToast(props) {
  const { isInvalidPaste } = useInvalidPaste();

  return <Toast isVisible={isInvalidPaste} text={`􀉾 ${i18n.t(i18n.l.toasts.invalid_paste)}`} {...props} />;
}
