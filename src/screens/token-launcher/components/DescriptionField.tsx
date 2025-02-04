import React from 'react';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';
import { FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR } from '../constants';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';

export function DescriptionField() {
  const setDescription = useTokenLauncherStore(state => state.setDescription);

  return (
    <CollapsableField title="Description">
      <SingleFieldInput
        style={{
          borderRadius: FIELD_INNER_BORDER_RADIUS,
          backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
          paddingVertical: 0,
          paddingHorizontal: 16,
        }}
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
