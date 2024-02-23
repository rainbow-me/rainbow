import { useFocusEffect } from '@react-navigation/native';
import { debounce, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, TextInputProps, ViewProps } from 'react-native';
import InlineField, { InlineFieldProps } from '../../inputs/InlineField';
import Skeleton, { FakeText } from '../../skeleton/Skeleton';
import { Box, Column, Columns, Separator, Stack } from '@/design-system';
import { ENS_RECORDS } from '@/helpers/ens';
import { useENSRegistrationForm } from '@/hooks';

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
  const { errors, isLoading, selectedFields, onChangeField, onBlurField, submitting, values } = useENSRegistrationForm();

  const [yOffsets, setYOffsets] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!isEmpty(errors)) {
      const firstErrorKey = Object.keys(errors)[0];
      onError?.({ yOffset: yOffsets[firstErrorKey] || 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...Object.keys(errors), onError, yOffsets, submitting]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent, key: ENS_RECORDS) => {
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
        <Box paddingTop="19px (Deprecated)" style={{ height: 300 }}>
          <Skeleton animated>
            <Stack space="30px (Deprecated)">
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
          {selectedFields.map(({ label, inputProps, placeholder, startsWith, id, key }) => (
            <Box key={id} onLayout={e => handleLayout(e, key)}>
              <Field
                autoFocus={autoFocusKey === key}
                defaultValue={values[key]}
                errorMessage={errors[key]}
                inputProps={inputProps}
                key={key}
                label={label}
                onChangeText={debounce(text => onChangeField({ key, value: text }), 300)}
                onEndEditing={({ nativeEvent }) => {
                  onBlurField({ key, value: nativeEvent.text });
                }}
                onFocus={onFocus}
                placeholder={placeholder}
                selectionColor={selectionColor}
                shouldFormatText={
                  key === ENS_RECORDS.name ||
                  key === ENS_RECORDS.description ||
                  key === ENS_RECORDS.notice ||
                  key === ENS_RECORDS.keywords ||
                  key === ENS_RECORDS.pronouns
                }
                startsWith={startsWith}
                testID={`ens-text-record-${key}`}
              />
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

function Field({ defaultValue, ...props }: InlineFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    // If the field is touched, we don't want to set the default value again.
    if (isTouched) return;

    setValue(defaultValue);
  }, [defaultValue, isTouched]);

  // Set fields to be not touched when screen gets out of focus.
  useFocusEffect(useCallback(() => () => setIsTouched(false), []));

  return (
    <>
      <Separator color="divider40 (Deprecated)" />
      <InlineField
        {...props}
        onChangeText={text => {
          props.onChangeText(text);
          setIsTouched(true);
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
