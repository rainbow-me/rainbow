import React from 'react';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';
import { FIELD_INNER_BORDER_RADIUS } from '../constants';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';

export function DescriptionField() {
  const setDescription = useTokenLauncherStore(state => state.setDescription);

  return (
    <CollapsableField title="Description">
      <SingleFieldInput
        style={{ borderRadius: FIELD_INNER_BORDER_RADIUS }}
        onInputChange={text => setDescription(text)}
        textAlign="left"
        inputStyle={{ textAlign: 'left' }}
        multiline
        spellCheck={true}
        placeholder="Describe your coin"
      />
    </CollapsableField>
  );
}
