import React from 'react';
import InlineField from '../../inputs/InlineField';
import { Box, Divider } from '@rainbow-me/design-system';
import { textRecordFields } from '@rainbow-me/helpers/ens';
import { useENSProfileForm } from '@rainbow-me/hooks';

export default function TextRecordsForm({
  defaultFields,
}: {
  defaultFields: (keyof typeof textRecordFields)[];
}) {
  const {
    selectedFields,
    onChangeField,
    onBlurField,
    values,
  } = useENSProfileForm({
    defaultFields: defaultFields.map(fieldName => textRecordFields[fieldName]),
  });

  return (
    <Box>
      {selectedFields.map(
        ({ label, inputProps, placeholder, validations, id, key }) => (
          <Box key={id}>
            <Divider />
            <InlineField
              defaultValue={values[key]}
              inputProps={inputProps}
              label={label}
              onChangeText={text => onChangeField({ key, value: text })}
              onEndEditing={({ nativeEvent }) => {
                onBlurField({ key, value: nativeEvent.text });
              }}
              placeholder={placeholder}
              validations={validations}
            />
          </Box>
        )
      )}
    </Box>
  );
}
