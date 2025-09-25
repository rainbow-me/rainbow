import * as i18n from '@/languages';
import React from 'react';
import Toast from './Toast';
import { useInvalidPaste } from '@/hooks';

export default function InvalidPasteToast(props) {
  const { isInvalidPaste } = useInvalidPaste();

  return <Toast isVisible={isInvalidPaste} text={`􀉾 ${i18n.t(i18n.l.toasts.invalid_paste)}`} {...props} />;
}
