import React from 'react';

import { Box } from '@/design-system';
import * as i18n from '@/languages';

import { FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR } from '../constants';
import { validateDescriptionWorklet } from '../helpers/inputValidators';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';

export function DescriptionField() {
  const setDescription = useTokenLauncherStore(state => state.setDescription);

  return (
    <CollapsableField title={i18n.t(i18n.l.token_launcher.titles.description)}>
      <Box style={{ minHeight: 75 }}>
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
          validationWorklet={validateDescriptionWorklet}
          textAlignVertical="top"
          onInputChange={text => setDescription(text)}
          numberOfLines={3}
          textAlign="left"
          inputStyle={{ textAlign: 'left' }}
          autoCorrect={true}
          placeholder={i18n.t(i18n.l.token_launcher.placeholders.describe_your_coin)}
        />
      </Box>
    </CollapsableField>
  );
}
