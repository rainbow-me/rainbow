import React from 'react';
import * as i18n from '@/languages';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';
import { FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR, MAX_DESCRIPTION_LENGTH } from '../constants';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';

export function DescriptionField() {
  const setDescription = useTokenLauncherStore(state => state.setDescription);

  return (
    <CollapsableField title={i18n.t(i18n.l.token_launcher.titles.description)}>
      <SingleFieldInput
        multiline
        style={{
          // required to override default height and allow the multiline input to grow
          height: undefined,
          minHeight: 75,
          borderRadius: FIELD_INNER_BORDER_RADIUS,
          backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
          paddingHorizontal: 16,
        }}
        validationWorklet={text => {
          'worklet';
          if (text.trim().length > MAX_DESCRIPTION_LENGTH) {
            return { error: true, message: i18n.t(i18n.l.token_launcher.input_errors.too_long) };
          }
        }}
        textAlignVertical="top"
        onInputChange={text => setDescription(text)}
        numberOfLines={3}
        textAlign="left"
        inputStyle={{ textAlign: 'left' }}
        autoCorrect={true}
        placeholder={i18n.t(i18n.l.token_launcher.placeholders.describe_your_coin)}
      />
    </CollapsableField>
  );
}
