import React from 'react';
import AddCashSheet from '../AddCashSheet';
import ImportSeedPhraseSheetWithData from '../ImportSeedPhraseSheetWithData';
import SendSheetWithData from '../SendSheetWithData';

export const appearListener = { current: null };
export const setListener = listener => (appearListener.current = listener);

export function SendSheetWrapper(...props) {
  return <SendSheetWithData {...props} setAppearListener={setListener} />;
}

export function AddCashSheetWrapper(...props) {
  return <AddCashSheet {...props} setAppearListener={setListener} />;
}

export function ImportSeedPhraseSheetWrapper(...props) {
  return (
    <ImportSeedPhraseSheetWithData {...props} setAppearListener={setListener} />
  );
}
