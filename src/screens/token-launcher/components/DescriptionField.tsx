import React from 'react';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';
import { FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR, MAX_DESCRIPTION_LENGTH } from '../constants';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';

export function DescriptionField() {
  const setDescription = useTokenLauncherStore(state => state.setDescription);

  return (
    <CollapsableField title="Description">
      <SingleFieldInput
        multiline
        style={{
          minHeight: 75,
          borderRadius: FIELD_INNER_BORDER_RADIUS,
          backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
          paddingHorizontal: 16,
        }}
        // TODO: Allegedly no longer needed
        // validationWorklet={text => {
        //   'worklet';
        //   if (text.trim().length > MAX_DESCRIPTION_LENGTH) {
        //     return `Too long, friend.`;
        //   }
        //   return '';
        // }}
        onInputChange={text => setDescription(text)}
        numberOfLines={3}
        textAlign="left"
        inputStyle={{ textAlign: 'left' }}
        autoCorrect={true}
        placeholder="Describe your coin"
      />
    </CollapsableField>
  );
}
