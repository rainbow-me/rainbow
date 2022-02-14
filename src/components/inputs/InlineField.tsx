import React, { useCallback, useMemo, useState } from 'react';
import { TextInputProps } from 'react-native';
import Input from './Input';
import {
  Column,
  Columns,
  Inset,
  Text,
  useTextStyle,
} from '@rainbow-me/design-system';

const textSize = 16;

export type InlineFieldProps = {
  defaultValue?: string;
  label: string;
  placeholder?: string;
  inputProps?: Partial<TextInputProps>;
  onChangeText: (text: string) => void;
  onEndEditing?: TextInputProps['onEndEditing'];
  validations?: {
    allowCharacterRegex?: { match: RegExp };
    maxLength?: { value: number };
  };
  value: string;
};

export default function InlineField({
  label,
  onChangeText,
  placeholder,
  inputProps,
  validations,
  onEndEditing,
  value,
}: InlineFieldProps) {
  const textStyle = useTextStyle({ size: `${textSize}px`, weight: 'bold' });

  const [inputHeight, setInputHeight] = useState(textSize);
  const handleContentSizeChange = useCallback(
    ({ nativeEvent }) => {
      if (inputProps?.multiline) {
        const contentHeight = nativeEvent.contentSize.height;
        if (contentHeight > 30) {
          setInputHeight(nativeEvent.contentSize.height);
        } else {
          setInputHeight(textSize);
        }
      }
    },
    [inputProps?.multiline]
  );

  const handleChangeText = useCallback(
    text => {
      const { allowCharacterRegex } = validations || {};
      if (!allowCharacterRegex) {
        onChangeText(text);
        return;
      }
      if (text === '') {
        onChangeText(text);
        return;
      }
      if (allowCharacterRegex?.match.test(text)) {
        onChangeText(text);
        return;
      }
    },
    [onChangeText, validations]
  );

  const style = useMemo(
    () => ({
      ...textStyle,
      height: inputHeight + 34 + (android ? 2 : 0),
      lineHeight: android ? textStyle.lineHeight : undefined,
      marginBottom: 0,
      marginTop: 0,
      paddingTop: inputProps?.multiline
        ? android
          ? 11
          : 15
        : android
        ? 15
        : 0,
      textAlignVertical: 'top',
    }),
    [textStyle, inputHeight, inputProps?.multiline]
  );

  return (
    <Columns>
      <Column width="1/3">
        <Inset top="19px">
          <Text size={`${textSize}px`} weight="heavy">
            {label}
          </Text>
        </Inset>
      </Column>
      <Input
        maxLength={validations?.maxLength?.value}
        onChangeText={handleChangeText}
        onContentSizeChange={handleContentSizeChange}
        onEndEditing={onEndEditing}
        placeholder={placeholder}
        style={style}
        value={value}
        {...inputProps}
        keyboardType={android ? 'visible-password' : inputProps?.keyboardType}
      />
    </Columns>
  );
}
