import React from 'react';
import InlineField from '../../inputs/InlineField';
import { Box, Divider } from '@rainbow-me/design-system';
import { TextRecordField } from '@rainbow-me/helpers/ens';

type TextRecordsFormProps = {
  onBlurField: ({ key, value }: { key: string; value: string }) => void;
  onChangeField: ({ key, value }: { key: string; value: string }) => void;
  selectedFields: TextRecordField[];
  values: any;
};

export default function TextRecordsForm({
  onBlurField,
  onChangeField,
  selectedFields,
  values,
}: TextRecordsFormProps) {
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
