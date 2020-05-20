import React from 'react';
import AddCashSheet from '../screens/AddCashSheet';
import ImportSeedPhraseSheetWithData from '../screens/ImportSeedPhraseSheetWithData';
import SendSheet from '../screens/SendSheet';

export const appearListener = { current: null };
export const setListener = listener => (appearListener.current = listener);

export function SendSheetWrapper(...props) {
  return <SendSheet {...props} setAppearListener={setListener} />;
}

export function AddCashSheetWrapper(...props) {
  return <AddCashSheet {...props} setAppearListener={setListener} />;
}

export function ImportSeedPhraseSheetWrapper(...props) {
  return (
    <ImportSeedPhraseSheetWithData {...props} setAppearListener={setListener} />
  );
}
