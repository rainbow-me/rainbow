import React from 'react';
import AddCashSheet from '../AddCashSheet';
import ExpandedAssetSheet from '../ExpandedAssetSheet';
import ImportSeedPhraseSheetWithData from '../ImportSeedPhraseSheetWithData';
import SendSheet from '../SendSheet';

export const appearListener = { current: null };
export const setListener = listener => (appearListener.current = listener);

export function AddCashSheetWrapper(...props) {
  return <AddCashSheet {...props} setAppearListener={setListener} />;
}

export function ExpandedAssetSheetWrapper(...props) {
  return <ExpandedAssetSheet {...props} setAppearListener={setListener} />;
}

export function ImportSeedPhraseSheetWrapper(...props) {
  return (
    <ImportSeedPhraseSheetWithData {...props} setAppearListener={setListener} />
  );
}

export function SendSheetWrapper(...props) {
  return <SendSheet {...props} setAppearListener={setListener} />;
}
