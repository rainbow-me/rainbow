import { debounce, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { TextInputProps, ViewProps } from 'react-native';
import InlineField, { InlineFieldProps } from '../../inputs/InlineField';
import Skeleton, { FakeText } from '../../skeleton/Skeleton';
import {
  Box,
  Column,
  Columns,
  Divider,
  Stack,
} from '@rainbow-me/design-system';
import { useENSRegistrationForm } from '@rainbow-me/hooks';

export default function TextRecordsForm({
  autoFocusKey,
  onAutoFocusLayout,
  onFocus,
  onError,
  selectionColor,
}: {
  autoFocusKey?: string;
  onAutoFocusLayout?: ViewProps['onLayout'];
  onFocus?: TextInputProps['onFocus'];
  onError?: ({ yOffset }: { yOffset: number }) => void;
  selectionColor?: string;
}) {
  const {
    errors,
    isLoading,
    selectedFields,
    onChangeField,
    onBlurField,
    submitting,
    values,
  } = useENSRegistrationForm();

  const [yOffsets, setYOffsets] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!isEmpty(errors)) {
      const firstErrorKey = Object.keys(errors)[0];
      onError?.({ yOffset: yOffsets[firstErrorKey] || 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...Object.keys(errors), onError, yOffsets, submitting]);

  const handleLayout = useCallback(
    (e, key) => {
      const yOffset = e.nativeEvent?.layout.y;
      setYOffsets(yOffsets => ({
        ...yOffsets,
        [key]: yOffset,
      }));
      if (autoFocusKey === key) {
        onAutoFocusLayout?.(e);
      }
    },
    [autoFocusKey, onAutoFocusLayout]
  );

  return (
    <Box>
      {isLoading ? (
        <Box paddingTop="19px" style={{ height: 300 }}>
          <Skeleton animated>
            <Stack space="30px">
              <FakeField />
              <FakeField />
              <FakeField />
              <FakeField />
              <FakeField />
            </Stack>
          </Skeleton>
        </Box>
      ) : (
        <>
          {selectedFields.map(
            ({
              label,
              inputProps,
              placeholder,
              startsWith,
              validations,
              id,
              key,
            }) => (
              <Box key={id} onLayout={e => handleLayout(e, key)}>
                <Field
                  autoFocus={autoFocusKey === key}
                  defaultValue={values[key]}
                  errorMessage={errors[key]}
                  inputProps={inputProps}
                  key={key}
                  label={label}
                  onChangeText={debounce(
                    text => onChangeField({ key, value: text }),
                    300
                  )}
                  onEndEditing={({ nativeEvent }) => {
                    onBlurField({ key, value: nativeEvent.text });
                  }}
                  onFocus={onFocus}
                  placeholder={placeholder}
                  selectionColor={selectionColor}
                  startsWith={startsWith}
                  testID={`ens-text-record-${key}`}
                  validations={validations}
                />
              </Box>
            )
          )}
        </>
      )}
    </Box>
  );
}

function Field({ defaultValue, ...props }: InlineFieldProps) {
  const [value, setValue] = useState(defaultValue);

  // Set / clear values when the screen comes to focus / unfocus.
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <>
      <Divider color="divider40" />
      <InlineField
        {...props}
        onChangeText={text => {
          props.onChangeText(text);
          setValue(text);
        }}
        value={value}
      />
    </>
  );
}

function FakeField() {
  return (
    <Columns space="10px">
      <Column width="1/3">
        <FakeText height={16} width="100%" />
      </Column>
      <FakeText height={16} width="100%" />
    </Columns>
  );
}
