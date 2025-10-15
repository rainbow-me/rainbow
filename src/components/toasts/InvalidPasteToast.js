import i18n from '@/languages';
import React from 'react';
import Toast from './Toast';
import { useInvalidPaste } from '@/hooks';

export default function InvalidPasteToast(props) {
  const { isInvalidPaste } = useInvalidPaste();

  return <Toast isVisible={isInvalidPaste} text={`􀉾 ${i18n.toasts.invalid_paste()}`} {...props} />;
}
