import React from 'react';
import AddCashSheet from '../screens/AddCashSheet';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import ImportSeedPhraseSheet from '../screens/ImportSeedPhraseSheet';
import SendSheet from '../screens/SendSheet';

export const appearListener = { current: null };
export const setListener = listener => (appearListener.current = listener);

export function AddCashSheetWrapper(...props) {
  return <AddCashSheet {...props} setAppearListener={setListener} />;
}

export function ExpandedAssetSheetWrapper(...props) {
  return <ExpandedAssetSheet {...props} setAppearListener={setListener} />;
}

export function ImportSeedPhraseSheetWrapper(...props) {
  return <ImportSeedPhraseSheet {...props} setAppearListener={setListener} />;
}

export function SendSheetWrapper(...props) {
  return <SendSheet {...props} setAppearListener={setListener} />;
}
